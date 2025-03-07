import PouchDB from 'pouchdb-browser'
import Config from '../Config'
import PouchDBAuth from 'pouchdb-authentication'

PouchDB.plugin(PouchDBAuth)

const dBObj = {}
const dbRemoteObj = {}
const dbUsersName = '_users'
const user_name = 'tms'

export function usePouchDB() {
    //----------------------------- ініціалізація ------------------------------
    const getDB = async (db) => {
        if (db !== '_users') {
            db = user_name + '_' + db
        }

        if (!dBObj[db] || dBObj[db]._destroyed) {
            dBObj[db] = new PouchDB(db)
        }

        try {
            await dBObj[db].info()
        } catch (error) {
            console.warn(`З'єднання з ${db} втрачено, перевідкриваю...`)
            dBObj[db] = new PouchDB(db)
        }

        return dBObj[db]
    }

    const initUsersDb = async (array) => {
        if (!dbRemoteObj[dbUsersName]) {
            dbRemoteObj[dbUsersName] = new PouchDB(Config.remoteCouchDb + dbUsersName, {
                skip_setup: true
            })
        }
    }

    const destroyDB = (dbName) => {
        return new Promise(async (resolve, reject) => {
            const db = await getDB(dbName)
            db.info().then(function (info) {
                db.destroy(function (err, response) {
                    if (err) {
                        console.error(`Помилка видалення бази ${dbName}`, err);
                        reject(err)
                    } else {
                        console.error(`Базу ${db} видалено`, response);
                        resolve(response)
                    }
                })
            }).catch(function (err) {
                console.error(`База ${db} не існує`);
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
    const fetchData = async (dbName) => {
        try {
            const db = await getDB(dbName)
            const result = await db.allDocs({ include_docs: true })
            console.log('CouchDb data fetched', result)
            return result?.rows?.map(row => row.doc)
        } catch (error) {
            throw error
        }
    }

    const getDoc = async (dbName, docId) => {
        try {
            const db = await getDB(dbName)
            const doc = await db.get(docId)
            return doc
        } catch (error) {
            throw error
        }
    }

    const putData = async (dbName, doc) => {
        try {
            const db = await getDB(dbName)
            return await db.put(doc)
        } catch (error) {
            throw error
        }
    }

    const updateDoc = async (dbName, docId, payload) => {
        const db = await getDB(dbName)
        const doc = await db.get(docId);
        return await db.put({
            _id: docId,
            _rev: doc._rev,
            ...payload
        })
    }

    const deleteDoc = async (dbName, docId) => {
        const db = await getDB(dbName)
        const doc = await db.get(docId)
        return await db.remove(doc, { _deleted: true })
    }

    const updateDontSendSMS = async (dbName, docId, pointId) => {
        try {
            if (!docId) {
                throw new Error('docId is required')
            }

            const db = await getDB(dbName)

            // Перевіряємо, чи існує документ
            let doc
            try {
                doc = await db.get(docId)
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

            return await db.put(updatedDoc)
        } catch (error) {
            console.error('Error updating document:', error)
            throw error
        }
    }

    const bulkDocs = async (dbName, docs) => {
        try {
            const db = await getDB(dbName)
            return await db.bulkDocs(docs, { new_edits: false })
        }
        catch (error) {
            throw error
        }
    }

    const deleteBulkDocs = async (dbName, docs) => {
        try {
            const db = await getDB(dbName)
            docs = docs.map(async d => {
                const doc = await db.get(d._id)
                doc._id = d._id
                doc._rev = doc._rev
                doc._deleted = true
                return doc
            })
            return await db.bulkDocs(docs)
        }
        catch (error) {
            throw error
        }
    }

    const changes = async (dbName, options = {}) => {
        try {
            const db = await getDB(dbName)
            return db.changes(options)
        } catch (error) {
            throw error
        }
    }

    return {
        fetchData, getDoc, putData, updateDoc, deleteDoc, destroyDB, login, logout, initUsersDb, getUserSession,
        getUserData, updateDontSendSMS, bulkDocs, changes, deleteBulkDocs
    }
}