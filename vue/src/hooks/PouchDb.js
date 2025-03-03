import PouchDB from 'pouchdb-browser'
import Config from '../Config'
import PouchDBFind from 'pouchdb-find'
import PouchDBAuth from 'pouchdb-authentication'

PouchDB.plugin(PouchDBAuth)
PouchDB.plugin(PouchDBFind)

const dbObj = {}
const dbRemoteObj = {}
const dbUsersName = '_users'
const user_name = 'tms'

export function usePouchDB() {
    //----------------------------- ініціалізація ------------------------------
    const initDb = (db) => {
        if (db !== '_users') {
            db = user_name + '_' + db
        }
        if (!dbObj[db]) {
            dbObj[db] = new PouchDB(db)
        }

        if (!dbRemoteObj[db]) {
            dbRemoteObj[db] = new PouchDB(Config.remoteCouchDb + db, {
                skip_setup: true
            })
        }
        return db
    }

    const initUsersDb = async (array) => {
        if (!dbRemoteObj[dbUsersName]) {
            dbRemoteObj[dbUsersName] = new PouchDB(Config.remoteCouchDb + dbUsersName, {
                skip_setup: true
            })
        }
    }

    const destroyDB = (dbName) => {
        return new Promise((resolve, reject) => {
            const db = initDb(dbName)
            dbObj[db].info().then(function (info) {
                dbObj[db].destroy(function (err, response) {
                    if (err) {
                        console.log(`Помилка видалення бази ${db}`, err);
                        reject(err)
                    } else {
                        console.log(`Базу ${db} видалено`, response);
                        resolve(response)
                    }
                })
            }).catch(function (err) {
                console.log(`База ${db} не існує`);
                resolve()
            })
        })
    }
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
                    reject(err)
                } else if (!response.userCtx.name) {
                    console.log("Не авторизований");
                    reject(response)
                } else {
                    console.log("Авторизований", response.userCtx.name);
                    resolve(response)
                }
            })
        })
    }

    const getUserData = async (user) => {
        return new Promise((resolve, reject) => {
            initUsersDb()
            dbRemoteObj[dbUsersName].getUser(user, function (err, response) {
                if (err) {
                    reject(err)
                } else {
                    resolve(response)
                }
            })
        })
    }


    // ------------------------ робота з локальними даними ---------------------
    const fetchData = async (dbName, options = { selector: {} }) => {
        try {
            const db = initDb(dbName)
            const result = await dbObj[db].find(options)
            console.log('CouchDb data fetched')
            return result && result.docs
        } catch (error) {
            throw error
        }
    }

    const getDoc = async (dbName, docId) => {
        try {
            const db = initDb(dbName)
            const doc = await dbObj[db].get(docId)
            return doc
        } catch (error) {
            throw error
        }
    }

    const putData = async (dbName, doc) => {
        try {
            const db = initDb(dbName)
            return await dbObj[db].put(doc)
        } catch (error) {
            throw error
        }
    }

    const updateDoc = async (dbName, docId, payload) => {
        const db = initDb(dbName)
        const doc = await dbObj[db].get(docId);
        return await dbObj[db].put({
            _id: docId,
            _rev: doc._rev,
            ...payload
        })
    }

    const deleteDoc = async (dbName, docId) => {
        const db = initDb(dbName)
        const doc = await dbObj[db].get(docId)
        return await dbObj[db].remove(doc, { _deleted: true })
    }

    const updateDontSendSMS = async (dbName, docId, pointId) => {
        try {
            if (!docId) {
                throw new Error('docId is required')
            }

            const db = initDb(dbName)

            // Перевіряємо, чи існує документ
            let doc
            try {
                doc = await dbObj[db].get(docId)
            } catch (error) {
                if (error.status === 404) {
                    // Документ не знайдено, створюємо новий
                    doc = {
                        _id: docId,
                        dontSendSMS: [],
                    }
                } else {
                    throw error // Інша помилка, не пов'язана з відсутністю документа
                }
            }

            // Оновлюємо масив `dontSendSMS`
            const updatedDontSendSMS = doc.dontSendSMS || []
            if (!updatedDontSendSMS.includes(pointId)) {
                updatedDontSendSMS.push(pointId)
            }

            // Зберігаємо документ (новий або оновлений)
            const updatedDoc = {
                ...doc,
                dontSendSMS: updatedDontSendSMS,
            }

            return await dbObj[db].put(updatedDoc)
        } catch (error) {
            console.error('Error updating document:', error)
            throw error
        }
    }

    // ------------------ работа з віддаленними данними ------------------------
    const fetchRemoteData = async (dbName, options = { selector: {} }) => {
        try {
            const db = initDb(dbName)
            options = {
                ...options,
                limit: options.limit || 1000
            }

            const result = await dbRemoteObj[db].find(options)
            // const explain = await dbRemoteObj[db].explain(options)
            // console.log('explain', JSON.stringify(explain, null, 2))
            console.log(JSON.stringify(options, null, 2), result)
            console.log('CouchDb data fetched')
            return result && result.docs
        } catch (error) {
            throw error
        }
    }
    // const getRemoteDocs = async (dbName, keys) => {
    //     try {
    //         const db = initDb(dbName)
    //         const result = await dbRemoteObj[db].allDocs({
    //             include_docs: true,
    //             keys
    //         })
    //         const docs = result.rows
    //             .filter(row => row.doc) // Фільтруємо, якщо деякі документи не знайдено
    //             .map(row => row.doc)
    //         return docs
    //     } catch (error) {
    //         throw error
    //     }
    // }
    // const allRemoteDocs = async (dbName, ids) => {
    //     try {
    //         const db = initDb(dbName)
    //         console.log('fetchRemoteData', db)
    //         return await dbRemoteObj[db].allDocs({
    //             include_docs: true,
    //             keys: ids
    //         })
    //     } catch (error) {
    //         console.error("plk1", error)
    //     }
    // }

    // const getRemoteDoc = async (dbName, docId) => {
    //     try {
    //         const db = initDb(dbName)
    //         console.log('getRemoteDoc', db)
    //         return await dbRemoteObj[db].get(docId)
    //     } catch (error) {
    //         console.error("Документ не знайдено", docId)
    //     }
    // }
    const viewRemoteByDrivers = async (key) => {
        try {
            const db = initDb('routes')
            console.log('viewByDriver', db)
            return await dbRemoteObj[db].query('my_search_index/by_driver_ids', { key })
        } catch (error) {
            console.error("view error", error)
        }
    }
    const viewRemoteByCarriers = async (keys) => {
        try {
            const db = initDb('routes')
            console.log('viewByDriver', db)
            return await dbRemoteObj[db].query('my_search_index/by_carrier_ids', { keys })
        } catch (error) {
            console.error("view error", error)
        }
    }
    // const countByDrivers = async (key) => {
    //     try {
    //         const db = initDb('routes')
    //         console.log('viewByDriver', db)
    //         return await dbRemoteObj[db].query('driver_count/count_by_driver', { key, group: true })
    //     } catch (error) {
    //         console.error("view error", error)
    //     }
    // }
    // const countByManagers = async (keys) => {
    //     try {
    //         const db = initDb('routes')
    //         console.log('viewByDriver', db)
    //         return await dbRemoteObj[db].query('driver_count/count_by_manager', { keys, group: true })
    //     } catch (error) {
    //         console.error("view error", error)
    //     }
    // }
    const viewByActiveRoutesDrivers = async (key) => {
        try {
            const db = initDb('routes')
            console.log('viewByDriver', db)
            return await dbRemoteObj[db].query('my_search_index/by_active_routes_driver_ids', { key })
        } catch (error) {
            console.error("view error", error)
        }
    }
    const viewByDates = async (keys) => {
        try {
            const db = initDb('routes')
            console.log('viewByDriver', db)
            return await dbRemoteObj[db].query('my_search_index/by_date', { keys })
        } catch (error) {
            console.error("view error", error)
        }
    }
    // ------------------------------- індекси тестування ------------------------
    const getIndexes = async (dbName) => {
        try {
            const db = initDb(dbName)
            return await dbRemoteObj[db].getIndexes()
        } catch (error) {
            console.error("getIndexes", error)
        }
    }
    const explain = async (dbName) => {
        try {
            const db = initDb(dbName)
            return await dbRemoteObj[db].explain()
        } catch (error) {
            console.error("explain", error)
        }
    }
    // ------------------------------- реплікація ------------------------------
    const pull = async (dbName, options = {}) => {
        try {
            const db = initDb(dbName)
            console.log('CouchDb data pulled')
            return await dbObj[db].replicate.from(dbRemoteObj[db], options)
        } catch (error) {
            throw error
        }
    }

    const push = async (dbName) => {
        try {
            const db = initDb(dbName)
            console.log('CouchDb data pushed')
            return await dbObj[db].replicate.to(dbRemoteObj[db])
        } catch (error) {
            throw error
        }
    }

    return {
        fetchData, pull, getDoc, putData, updateDoc, deleteDoc, destroyDB, login, logout, initUsersDb, getUserSession,
        fetchRemoteData, push, getUserData, updateDontSendSMS, viewByActiveRoutesDrivers, getIndexes, explain,
        viewRemoteByDrivers, viewByDates, viewRemoteByCarriers
    }
}