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
      console.log(info.change)
    })
  } catch (error) {
    console.log('CouchDb sync error', error)
  }
}

syncData()
