const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))
const Config = require('./Config')
const dbName = 'tms_statuses'
const auth = Config.adminAuthCouchDb
const Base = require('./shared/base-class')

const remoteDB = new PouchDB(Config.remoteCouchDb + dbName, { auth })


const startChangesListener = () => {
  remoteDB.changes({
    since: 'now',
    live: true,
    include_docs: false
  }).on('change', async (change) => {
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
        // Якщо документ має статус 300 (виконано) і він змінився з попереднього статусу закриваємо документ в базі рейсів
        if (currentStatus === 300 && previousStatus !== 300) {
          console.log('Статус документа змінився з інший на виконано:', currentStatus);
          await Base.closeDocInDb(currentDoc)
          // Відправимо дані до Typhoon якщо документ закрито
          const preparedData = Base.prepareData(currentDoc)
          try {
            await Base.sendDataToTyphoon(preparedData)
          } catch (error) {
            console.log('Помилка відправки даних до Typhoon:', error.response.data);
          }

        } else {
          // Створимо об'єкт для швидкого доступу до точок попередньої версії за їх id
          const previousPointsMap = previousPoints.reduce((map, point) => {
            map[point.id] = point;
            return map;
          }, {});

          // Перевіряємо на розбіжності в статусах
          const differences = currentPoints.filter(point => {
            const prevPoint = previousPointsMap[point.id];
            return prevPoint && point.status !== prevPoint.status && point.status === 300 && point.id !== -1;
          });

          if (differences.length > 0) {
            console.log(`Знайдено розбіжності у статусах точок документа ${change.id}:`, differences);
            const preparedData = Base.prepareData(currentDoc)
            try {
              await Base.sendDataToTyphoon(preparedData)
            } catch (error) {
              console.log('Помилка відправки даних до Typhoon:', error.response.data);
            }
            //перевірити чи всі точки виконані окрім точки з id -1
            const allPointsDone = currentPoints.every(point => point.status === 300 || point.id === -1)

            if (allPointsDone) {
              console.log('Всі точки виконані');
              //Відправити листа зі звітом про закриття документа
              try {
                await Base.sendReportEmail(currentDoc)
                await Base.sendManagersReportEmail(currentDoc)
                await Base.sendManagersReturnReportEmail(currentDoc)
              } catch (error) {
                console.log('Помилка відправки листів:', error)
              }
            }
          } else {
            console.log('Розбіжностей у статусах точок не виявлено.');
          }
        }
      } else if (currentDoc.status === 300) {
        console.log('Статус документа змінився з інший на виконано:', currentStatus);
        await Base.closeDocInDb(currentDoc)
        // Відправимо дані до Typhoon якщо документ закрито
        const preparedData = Base.prepareData(currentDoc)
        try {
          await Base.sendDataToTyphoon(preparedData)
          await Base.sendDataToTyphoon(preparedData)
        } catch (error) {
          console.log('Помилка відправки даних до Typhoon:', error.response.data);
        }
        try {
          await Base.sendReportEmail(currentDoc)
          await Base.sendManagersReportEmail(currentDoc)
          await Base.sendManagersReturnReportEmail(currentDoc)
        } catch (error) {
          console.log('Помилка відправки листів:', error)
        }
      } else {
        console.log(`Для документа ${change.id} немає попередньої ревізії.`)
      }
    } catch (error) {
      console.log('Помилка при отриманні документа:', error)
    }

  }).on('error', (err) => {
    console.log('Помилка при відстеженні змін:', err)
    process.exit(1)
  })
}


startChangesListener()