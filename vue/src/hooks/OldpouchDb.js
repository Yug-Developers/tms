// import { ref, onUnmounted } from 'vue'
import { onBeforeUnmount } from 'vue'
import PouchDB from 'pouchdb-browser'
import Config from '../Config'
import { useAppStore } from '@/store/appStore'
import PouchDBFind from 'pouchdb-find'
import PouchDBAuth from 'pouchdb-authentication'

PouchDB.plugin(PouchDBAuth)
PouchDB.plugin(PouchDBFind)

const dbObj = {}
const dbRemoteObj = {}
const dbUsersName = 'tms_users'

export function usePouchDB() {
  const appStore = useAppStore()
  const user_id = appStore.user_id
  const user_name = appStore.user_name

  //----------------------------- ініціалізація ------------------------------
  const initUsersDb = async (array) => {
    if (!dbRemoteObj[dbUsersName]) {
      dbRemoteObj[dbUsersName] = new PouchDB(Config.remoteCouchDb + dbUsersName, {
        // auth: Config.remoteCouchDbAuth,
        skip_setup: true
      })
    }
  }
  const initDb = (db) => {
    if (db !== 'tms_users') {
      db = user_name + '_' + db
    }
    if (!dbObj[db]) {
      dbObj[db] = new PouchDB(db)
    }

    if (!dbRemoteObj[db]) {
      dbRemoteObj[db] = new PouchDB(Config.remoteCouchDb + db, {
        // auth: Config.remoteCouchDbAuth,
        skip_setup: true
      })
    }
    return db
  }

  // ------------------------------- робота з даними ---------------------------
  const fetchData = async (dbName) => {
    const db = initDb(dbName)
    dbObj[db].find({
      selector: {
        status: 'active'
      },
      // use_index: 'index', // Укажите имя дизайн-документа, если требуется
    }).then(result => {
      appStore.data[db] = result.docs
      console.log('CouchDb data fetched')
    }).catch(err => {
      console.error('Ошибка запроса:', err);
    });
  }

  const fetchRoutes = async (dbName = 'routes') => {
    const db = initDb(dbName)
    dbObj[db].find({
      selector: {
        status: 'active'
      },
      // use_index: 'index', // Укажите имя дизайн-документа, если требуется
    }).then(result => {
      appStore.data[db] = result.docs
      console.log('CouchDb data fetched')
    }).catch(err => {
      console.error('Ошибка запроса:', err);
    });
  }

  const fetchStatuses = async (dbName = 'statuses') => {
    const db = initDb(dbName)
    console.log('fetchStatuses', db)
    dbObj[db].find({
      selector: {
        // status: 'active'
      },
      // use_index: 'index', // Укажите имя дизайн-документа, если требуется
    }).then(result => {
      appStore.data[db] = result.docs
      console.log('CouchDb data fetched')
    }).catch(err => {
      console.error('Ошибка запроса:', err);
    });
  }

  const getRemoteDoc = async (dbName, docId) => {
    try {
      const db = initDb(dbName)
      console.log('getRemoteDoc', db)
      const doc = await dbRemoteObj[db].get(docId)
      return doc
    } catch (error) {
      console.error("plk1", error)
    }
  }
  const allRemoteDocs = async (dbName) => {
    try {
      const db = initDb(dbName)
      console.log('fetchRemoteData', db)
      return await dbRemoteObj[db].allDocs({
        include_docs: true,
        startkey: 'rt_',
      })
    } catch (error) {
      console.error("plk1", error)
    }
  }

  const getDoc = async (dbName, docId) => {
    try {
      const db = initDb(dbName)
      console.log('getDoc', db)
      const doc = await dbObj[db].get(docId)
      return doc
    } catch (error) {
      console.error("plk2", error)
    }
  }


  const putData = async (dbName, doc) => {
    const db = initDb(dbName)
    await dbObj[db].put(doc)
    await fetchData(dbName)
    await fetchStatuses()
  }


  const deleteDoc = async (docId) => {
    const db = initDb(dbName)
    const doc = await dbObj[db].get(docId)
    await dbObj[db].remove(doc)
    await fetchData(dbName)

  }

  const updateDoc = async (dbName, docId, payload) => {
    const db = initDb(dbName)
    const doc = await dbObj[db].get(docId);
    const response = await dbObj[db].put({
      _id: docId,
      _rev: doc._rev,
      ...payload
    })
    await fetchData(dbName)
  }
  // ------------------------------- работа з базою ---------------------------
  const compactDB = (dbName) => {
    return new Promise((resolve, reject) => {
      const db = initDb(dbName)
      dbObj[db].compact(function (err, response) {
        if (err) {
          console.log("Помилка", err);
          reject(err)
        } else {
          console.log("Компактовано", response);
          resolve(response)
        }
      })
    })
  }

  const destroyDB = (dbName) => {
    return new Promise((resolve, reject) => {
      const db = initDb(dbName)
      dbObj[db].destroy(function (err, response) {
        if (err) {
          console.log("Помилка", err);
          reject(err)
        } else {
          console.log(`Базу ${db} видалено`, response);
          resolve(response)
        }
      })
    }
    )
  }

  // ------------------------------- авторизація -----------------------------
  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      initUsersDb()
      dbRemoteObj[dbUsersName].login(username, password, function (err, response) {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }
  const logout = () => {
    return new Promise((resolve, reject) => {
      initUsersDb()
      dbRemoteObj[dbUsersName].logout(function (err, response) {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  const getUserSession = async () => {
    return new Promise((resolve, reject) => {
      initUsersDb()
      dbRemoteObj[dbUsersName].getSession(function (err, response) {
        console.log("авторизация ->", response)
        if (err) {
          console.error("Помилка", err);
          appStore.setSnackbar({ text: "Авторизації " + err, type: 'error' })
          reject(err)
        } else if (!response.userCtx.name) {
          console.log("Не авторизований");
          appStore.setSnackbar({ text: "Користувач не авторизован", type: 'error' })
          reject(response)
        } else {
          console.log("Авторизований", response.userCtx.name);
          resolve(response)
        }
      })
    })
  }
  const getUser = async (username) => {
    return new Promise((resolve, reject) => {
      initUsersDb()
      dbRemoteObj[dbUsersName].getUser(username, function (err, user) {
        if (err) {
          reject(err)
        } else {
          resolve(user)
        }
      })
    })
  }

  // ------------------------------- реплікація ------------------------------
  const push = (dbName) => {
    const db = initDb(dbName)
    return new Promise((resolve, reject) => {
      dbObj[db].replicate.to(dbRemoteObj[db], {
        live: false,
        retry: true
      }).on('paused', function (info) {
        // replication was paused, usually because of a lost connection
        console.log('replicateToRemote paused')
      }).on('active', function (info) {
        // replication was resumed
        console.log('replicateToRemote active')
      }).on('error', function (err) {
        // totally unhandled error (shouldn't happen)
        console.error('replicateToRemote error ' + err)
      })
        .on('change', () => fetchStatuses())
    })
  }

  const pull = (dbName) => {
    const db = initDb(dbName)
    return new Promise((resolve, reject) => {
      dbObj[db].replicate.from(dbRemoteObj[db], {
        filter: 'filter/by_status',
        live: false,
        retry: true
      }).on('paused', function (info) {
        // replication was paused, usually because of a lost connection
        console.log('replicateFromRemote paused')
      }).on('active', function (info) {
        // replication was resumed
        console.log('replicateFromRemote active')
      }).on('error', function (err) {
        // totally unhandled error (shouldn't happen)
        console.error('replicateFromRemote error ' + err)
      })
        .on('change', () => fetchData(dbName))
    })
  }

  const onBeforeUnmountHandler = () => {
    for (let dbName in dbObj) {
      dbObj[dbName].close()
      console.log('db closed ', dbName);
    }
    onBeforeUnmount(onBeforeUnmountHandler)
  }

  return {
    fetchData, putData, deleteDoc, updateDoc, login, getUser, getUserSession,
    logout, getRemoteDoc, compactDB, push, pull, onBeforeUnmountHandler, fetchStatuses,
    initDb, fetchRoutes, destroyDB, getDoc, allRemoteDocs
  }
}