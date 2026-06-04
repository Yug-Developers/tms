const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))
const Config = require('./Config')
const dbName = 'tms_statuses'
const auth = Config.adminAuthCouchDb
const Base = require('./shared/base-class')
const dbh = require('./db')
const remoteDB = new PouchDB(Config.remoteCouchDb + dbName, { auth })
const changesCheckpointId = '_local/tms-api-listener-checkpoint'
const maxReconnectDelayMs = 60000
let reconnectAttempts = 0
let reconnectTimer = null

const originalConsoleLog = console.log.bind(console)
const kyivDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Kyiv',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})
const kyivOffsetFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Kyiv',
  timeZoneName: 'longOffset'
})
const getKyivDateTimeParts = (date = new Date()) => Object.fromEntries(
  kyivDateTimeFormatter
    .formatToParts(date)
    .filter(part => part.type !== 'literal')
    .map(part => [part.type, part.value])
)
const getKyivOffset = (date = new Date()) => {
  const timeZoneName = kyivOffsetFormatter
    .formatToParts(date)
    .find(part => part.type === 'timeZoneName')
    ?.value || 'GMT+02:00'

  return timeZoneName.replace('GMT', '')
}
const getKyivTimestamp = () => {
  const parts = getKyivDateTimeParts()

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} Europe/Kyiv`
}
const getKyivIsoTimestamp = (date = new Date()) => {
  const parts = getKyivDateTimeParts(date)
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}${getKyivOffset(date)}`
}
console.log = (...args) => originalConsoleLog(getKyivTimestamp(), ...args)

const isClosingPoint = (point) => point.status === 300 || point.id === -1

const areAllPointsDone = (points = []) => {
  const regularPoints = points.filter(point => point.id !== -1)
  return regularPoints.length > 0 && regularPoints.every(isClosingPoint)
}

const isReturnHomePointPending = (points = []) => {
  const returnHomePoint = points.find(point => point.id === -1)
  return !returnHomePoint || returnHomePoint.status < 200
}

const shouldMarkReportReady = (points = []) => {
  return areAllPointsDone(points) && isReturnHomePointPending(points)
}

const shouldSendClosingReportEmails = (doc) => {
  return Boolean(doc.reportReadyAt) || shouldMarkReportReady(doc.points || [])
}

const getCompletedPointChanges = (previousPoints = [], currentPoints = []) => {
  const previousPointsMap = previousPoints.reduce((map, point) => {
    map[point.id] = point
    return map
  }, {})

  return currentPoints.filter(point => {
    const prevPoint = previousPointsMap[point.id]
    return prevPoint && point.status !== prevPoint.status && point.status === 300 && point.id !== -1
  })
}

const getErrorDetails = (error) => error?.response?.data || error?.message || error

const sendDataToTyphoon = async (doc) => {
  const preparedData = Base.prepareData(doc)
  try {
    await Base.sendDataToTyphoon(preparedData)
  } catch (error) {
    console.log('Помилка відправки даних до Typhoon:', getErrorDetails(error))
  }
}

const markReportEmailsSent = async (id) => {
  try {
    const doc = await remoteDB.get(id)
    if (doc.reportEmailsSentAt) {
      return
    }
    doc.reportEmailsSentAt = getKyivIsoTimestamp()
    await remoteDB.put(doc)
  } catch (error) {
    console.log('Помилка встановлення позначки відправки листів:', getErrorDetails(error))
  }
}

const ensureReportReady = async (doc) => {
  let reportStateDoc = await remoteDB.get(doc._id)
  if (reportStateDoc.reportReadyAt || reportStateDoc.reportEmailsSentAt) {
    return reportStateDoc
  }

  if (!shouldMarkReportReady(reportStateDoc.points || [])) {
    return reportStateDoc
  }

  reportStateDoc.reportReadyAt = getKyivIsoTimestamp()
  await remoteDB.put(reportStateDoc)
  reportStateDoc = await remoteDB.get(doc._id)
  console.log(`Зафіксовано готовність звіту для документа ${doc._id}:`, reportStateDoc.reportReadyAt)
  return reportStateDoc
}

const sendClosingReportEmails = async (doc, reason) => {
  const reportStateDoc = await ensureReportReady(doc)
  if (reportStateDoc.reportEmailsSentAt) {
    console.log(`Листи для документа ${doc._id} вже були відправлені:`, reportStateDoc.reportEmailsSentAt)
    return
  }
  if (!reportStateDoc.reportReadyAt) {
    console.log(`Листи для документа ${doc._id} не відправлено: звіт ще не був готовий до точки повернення додому`)
    return
  }

  console.log(`Відправка листів для документа ${doc._id}. Причина: ${reason}`)
  try {
    await Base.sendReportEmail(reportStateDoc)
    await Base.sendManagersReportEmail(reportStateDoc)
    await Base.sendManagersReturnReportEmail(reportStateDoc)
    await Base.sendTasksReportEmail(reportStateDoc)
    await markReportEmailsSent(doc._id)
  } catch (error) {
    console.log('Помилка відправки листів:', getErrorDetails(error))
  }
}

const getChangesCheckpoint = async () => {
  try {
    const checkpoint = await remoteDB.get(changesCheckpointId)
    if (checkpoint.lastSeq) {
      return checkpoint.lastSeq
    }
  } catch (error) {
    if (error.status !== 404) {
      throw error
    }
  }

  const info = await remoteDB.info()
  await saveChangesCheckpoint(info.update_seq)
  return info.update_seq
}

const saveChangesCheckpoint = async (seq) => {
  try {
    const checkpoint = await remoteDB.get(changesCheckpointId).catch(error => {
      if (error.status === 404) {
        return { _id: changesCheckpointId }
      }
      throw error
    })
    checkpoint.lastSeq = seq
    checkpoint.updatedAt = new Date().toISOString()
    await remoteDB.put(checkpoint)
  } catch (error) {
    if (error.status === 409) {
      await saveChangesCheckpoint(seq)
      return
    }
    throw error
  }
}

const scheduleChangesListenerReconnect = () => {
  if (reconnectTimer) {
    return
  }

  reconnectAttempts += 1
  const delay = Math.min(maxReconnectDelayMs, reconnectAttempts * 5000)
  console.log(`Повторне підключення до CouchDB _changes через ${delay / 1000} сек.`)
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    startChangesListener()
  }, delay)
}

const handleChange = async (change) => {
  try {
    console.log('Зміни в документі:', change.id);

    const currentDoc = await remoteDB.get(change.id, { revs_info: true })
    const oldRevs = currentDoc._revs_info
      .filter(rev => rev.status === 'available') // Тільки доступні ревізії
      .map(rev => rev.rev)

    if (oldRevs.length > 1) {
      const prevRev = oldRevs[1]
      // Отримуємо попередню версію документа
      const previousDoc = await remoteDB.get(change.id, { rev: prevRev })
      // Порівняти зміни між поточною та попередньою версіями
      const previousStatus = previousDoc.status;
      const currentStatus = currentDoc.status;
      const previousPoints = previousDoc.points || [];
      const currentPoints = currentDoc.points || [];
      const allPointsDone = areAllPointsDone(currentPoints)
      const canSendClosingReportEmails = shouldSendClosingReportEmails(currentDoc)
      const documentJustDone = currentStatus === 300 && previousStatus !== 300

      // Перевіряємо на розбіжності в статусах
      const differences = getCompletedPointChanges(previousPoints, currentPoints)

      if (differences.length > 0) {
        console.log(`Знайдено розбіжності у статусах точок документа ${change.id}:`, differences);
        await sendDataToTyphoon(currentDoc)
        //перевірити чи всі точки виконані окрім точки з id -1
        if (canSendClosingReportEmails) {
          console.log('Всі точки виконані')
          await sendClosingReportEmails(currentDoc, 'всі точки виконані')
        } else if (allPointsDone) {
          console.log('Всі точки виконані, але точка повернення додому вже почата або завершена')
        }
      } else {
        console.log('Розбіжностей у статусах точок не виявлено.');
      }

      // Якщо документ має статус 300 (виконано) і він змінився з попереднього статусу закриваємо документ в базі рейсів
      if (documentJustDone) {
        console.log('Статус документа змінився з інший на виконано:', currentStatus);
        await Base.syncCompletedDocument(currentDoc, 'статус документа змінився на виконано', { forceSendToTyphoon: true })
        if (canSendClosingReportEmails) {
          await sendClosingReportEmails(currentDoc, 'статус документа змінився на виконано')
        } else if (allPointsDone) {
          console.log('Листи не відправлено після закриття документа: точка повернення додому вже почата або завершена')
        }
      } else if (currentStatus === 300) {
        await Base.syncCompletedDocument(currentDoc, 'документ вже виконано, перевірка закриття маршруту')
      }
    } else if (currentDoc.status === 300) {
      console.log('Статус документа виконано без доступної попередньої ревізії:', currentDoc.status);
      await Base.syncCompletedDocument(currentDoc, 'документ виконано без доступної попередньої ревізії')
      if (shouldSendClosingReportEmails(currentDoc)) {
        await sendClosingReportEmails(currentDoc, 'документ виконано без доступної попередньої ревізії')
      } else if (areAllPointsDone(currentDoc.points || [])) {
        console.log('Листи не відправлено без попередньої ревізії: точка повернення додому вже почата або завершена')
      }
    } else {
      console.log(`Для документа ${change.id} немає попередньої ревізії.`)
    }

    if (shouldSendClosingReportEmails(currentDoc)) {
      await sendClosingReportEmails(
        currentDoc,
        currentDoc.reportReadyAt ? 'звіт був готовий раніше, листи ще не відправлені' : 'всі точки виконані'
      )
    }
  } catch (error) {
    console.log('Помилка при отриманні документа:', error)
    throw error
  }
}

const startChangesListener = async () => {
  let since
  try {
    since = await getChangesCheckpoint()
  } catch (error) {
    console.log('Помилка читання checkpoint CouchDB _changes:', getErrorDetails(error))
    scheduleChangesListenerReconnect()
    return
  }

  console.log('Старт відстеження змін CouchDB з позиції:', since)

  let processing = Promise.resolve()
  const changes = remoteDB.changes({
    since,
    live: true,
    include_docs: false
  })

  changes.on('change', (change) => {
    processing = processing
      .then(async () => {
        await handleChange(change)
        await saveChangesCheckpoint(change.seq)
        reconnectAttempts = 0
      })
      .catch((error) => {
        console.log('Помилка послідовної обробки змін:', getErrorDetails(error))
        changes.cancel()
        scheduleChangesListenerReconnect()
      })
  }).on('error', (err) => {
    console.log('Помилка при відстеженні змін:', err)
    changes.cancel()
    processing.finally(scheduleChangesListenerReconnect)
  })
}

// ---  Connection to DB & Start server -------------
dbh.connect
  .then(async () => {
    console.log("Connected successfully to mySQL server")
    await startChangesListener()
  })
  .catch(err => {
    console.log(Error(err))
    process.exit()
  })
