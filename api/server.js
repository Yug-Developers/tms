const PouchDB = require('pouchdb')
const Config = require('./Config')
const dbName = 'tms_statuses'
const db = new PouchDB(dbName)
const remoteDB = new PouchDB(Config.remoteCouchDb + dbName, {
  auth: {
    username: 'admin',
    password: 'defred098'
  }
})
const dbNameRoutes = 'tms_routes'
const remoteDBRoutes = new PouchDB(Config.remoteCouchDb + dbNameRoutes, {
  auth: {
    username: 'admin',
    password
      : 'defred098'
  }
})

const axios = require('axios')

const syncData = async () => {
  console.log('CouchDb sync')
  try {
    PouchDB.sync(db, remoteDB, {
      live: true,
      retry: true
    }).on('paused', function () {
      // replication was paused, usually because of a lost connection
      console.log('CouchDb paused')
    }).on('active', function (info) {
      // replication was resumed
      console.log('CouchDb active')
    }).on('error', function (err) {
      // totally unhandled error (shouldn't happen)
      console.log('CouchDb error ' + err)
    }).on('change', async (info) => {
      console.log('Зміни в документі:', info.change);
      const changedDocs = info.change.docs;

      for (let doc of changedDocs) {
        try {
          // Отримати поточну версію документа разом з усіма ревізіями
          const currentDoc = await db.get(doc._id, { revs: true });

          // Перевірити наявність попередньої ревізії
          if (currentDoc._revisions && currentDoc._revisions.ids.length > 1) {
            // Отримати попередню ревізію
            const previousRev = `${currentDoc._revisions.start - 1}-${currentDoc._revisions.ids[1]}`;

            try {
              // Отримати попередню версію документа
              const previousDoc = await db.get(doc._id, { rev: previousRev });

              // Порівняти зміни між поточною та попередньою версіями
              console.log('Попередній документ:', previousDoc);
              console.log('Поточний документ:', currentDoc);

              const previousStatus = previousDoc.status;
              const currentStatus = currentDoc.status;
              const previousPoints = previousDoc.points || [];
              const currentPoints = currentDoc.points || [];
              // Якщо документ має статус 300 (виконано) і він змінився з попереднього статусу закриваємо документ в базі рейсів
              if (currentStatus === 300 && previousStatus !== 300) {
                console.log('Статус документа змінився з виконано на інший:', currentStatus);
                await closeDocInDb(doc._id)
              }
              // Створимо об'єкт для швидкого доступу до точок попередньої версії за їх id
              const previousPointsMap = previousPoints.reduce((map, point) => {
                map[point.id] = point;
                return map;
              }, {});

              // Перевіряємо на розбіжності в статусах
              const differences = currentPoints.filter(point => {
                const prevPoint = previousPointsMap[point.id];
                return prevPoint && point.status !== prevPoint.status;
              });

              if (differences.length > 0) {
                console.log('Знайдено розбіжності у статусах точок:', differences);
                const preparedData = prepareData(currentDoc)
                console.log('Підготовлені дані для відправки:', JSON.stringify(preparedData , null, 2));
                try {
                  const res = await sendDataToTyphoon(preparedData)
                } catch (error) {
                  console.log('Помилка відправки даних до Typhoon:', error.response.data);
                }
              } else {
                console.log('Розбіжностей у статусах точок не виявлено.');
              }
            } catch (err) {
              console.log('Помилка при отриманні попереднього документа:', err);
            }
          } else {
            console.log('Попередньої версії документа немає');
          }
        } catch (err) {
          console.log('Помилка при отриманні поточного документа', err);
        }
      }
    });
  } catch (error) {
    console.log('CouchDb sync error', error)
  }
}

syncData()

const closeDocInDb = async (id) => {
  try {
    const doc = await remoteDBRoutes.get(id)
    doc.status = 'closed'
    await remoteDBRoutes.put(doc)
    console.log(`Документ ${id} закрито в базі рейсів`);
  } catch (error) {
    throw error
  }
}

const sendDataToTyphoon = async (data) => {
  try {
    console.log(JSON.stringify(data, null, 2));
    console.log(`${Config.foxtrotApi.url}/trip-requests`)
    const authToken = await getAccessToken()
    const res = await axios({
      method: 'POST',
      data,
      url: `${Config.foxtrotApi.url}/trip-requests`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      }
    })
    if (res.data.error) {
      throw new Error(res.data.error)
    } else {
      return res.data
    }
  } catch (error) {
    throw error
  }
}

const getAccessToken = async (sufix) => {
  try {
    const path = 'foxtrotOauth2' + (sufix ? sufix : '')
    const { data } = await axios.post(
      Config[path].url,
      {
        client_id: Config[path].client_id,
        client_secret: Config[path].secret,
        grant_type: 'client_credentials'
      }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data.access_token

  } catch (error) {
    throw error
  }
}

const prepareData = (data) => {
  const statusMap = {
    300: 1,
    400: 2,
    500: 3
  }
  const points = data.points
  // Змінюємо статуси документів в docs точок на відповідні для Т22
  points.forEach(point => {
    point.docs.forEach(doc => {
      doc.status = statusMap[doc.status]
    })
  })

  const out = {
    id: data._id,
    status: data.status,
    startTime: data.startTime,
    finishTime: data.finishTime,
    odometerStart: data.odometerStart,
    odometerFinish: data.odometerFinish,
    points
  }
  return out
}
