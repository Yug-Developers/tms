const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))
const Config = require('./Config')
const dbName = 'tms_statuses'
const db = new PouchDB(dbName)
const auth = Config.adminAuthCouchDb
const Base = require('./shared/base-class')

const remoteDB = new PouchDB(Config.remoteCouchDb + dbName, { auth })
const remoteUsersDB = new PouchDB(Config.remoteCouchDb + '_users', { auth })

const initializeDatabase = async () => {
  try {
    await remoteUsersDB.createIndex({
      index: { fields: ['typhoonId'] }
    })
    console.log('Індекс для typhoonId створено.')
    await remoteUsersDB.createIndex({
      index: { fields: ['carrierId'] }
    })
    console.log('Індекс для carrierId створено.')
  } catch (error) {
    console.error('Помилка при створенні індексу:', error)
  }
}
// initializeDatabase()


const syncData = async () => {
  console.log('CouchDb sync')
  try {
    PouchDB.sync(db, remoteDB, {
      live: true,
      retry: true,
      include_docs: true
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
      // console.log('Зміни в документі:', info.change);
      const changedDocs = info.change.docs;

      for (let doc of changedDocs) {
        try {
          // Отримати поточну версію документа разом з усіма ревізіями
          const currentDoc = await db.get(doc._id, { revs: true });

          // Перевірити наявність попередньої ревізії
          if (currentDoc._revisions && currentDoc._revisions.ids.length > 1) {
            // Отримати попередню ревізію
            const previousRev = `${currentDoc._revisions.start - 1}-${currentDoc._revisions.ids[1]}`;
            // console.log('Усі ревізії:', JSON.stringify(currentDoc._revisions, null, 2));
            // console.log('Поточна ревізія:', doc._id, currentDoc._rev);
            // console.log('Попередня ревізія:', doc._id, previousRev);
            try {
              // Отримати попередню версію документа
              const previousDoc = await db.get(doc._id, { rev: previousRev });

              // Порівняти зміни між поточною та попередньою версіями
              // console.log('Попередній документ:', previousDoc);
              // console.log('Поточний документ:', currentDoc);

              const previousStatus = previousDoc.status;
              const currentStatus = currentDoc.status;
              const previousPoints = previousDoc.points || [];
              const currentPoints = currentDoc.points || [];
              // Якщо документ має статус 300 (виконано) і він змінився з попереднього статусу закриваємо документ в базі рейсів
              if (currentStatus === 300 && previousStatus !== 300) {
                console.log('Статус документа змінився з інший на виконано:', currentStatus);
                await Base.closeDocInDb(doc)
                // Відправимо дані до Typhoon якщо документ закрито
                const preparedData = Base.prepareData(currentDoc)
                try {
                  const res = await Base.sendDataToTyphoon(preparedData)
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
                  console.log('Знайдено розбіжності у статусах точок:', differences);
                  const preparedData = Base.prepareData(currentDoc)
                  // console.log('Підготовлені дані для відправки:', JSON.stringify(preparedData, null, 2));
                  try {
                    const res = await Base.sendDataToTyphoon(preparedData)
                  } catch (error) {
                    console.log('Помилка відправки даних до Typhoon:', error.response.data);
                  }
                  //перевірити чи всі точки виконані окрім точки з id -1
                  const allPointsDone = currentPoints.every(point => point.status === 300 || point.id === -1)
                  // await Base.sendManagersReportEmail(doc)
                  if (allPointsDone) {
                    console.log('Всі точки виконані');
                    //Відправити листа зі звітом про закриття документа
                    await Base.sendReportEmail(doc)
                    await Base.sendManagersReportEmail(doc)
                    await Base.sendManagersReturnReportEmail(doc)
                  }
                } else {
                  console.log('Розбіжностей у статусах точок не виявлено.');
                }
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
      } else {
        console.log(`Для документа ${change.id} немає попередньої ревізії.`)
      }
    } catch (error) {
      console.log('Помилка при отриманні документа:', error)
    }

  }).on('error', (err) => {
    console.log('Помилка при відстеженні змін:', err)
  })
}


startChangesListener()