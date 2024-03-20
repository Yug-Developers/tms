const PouchDB = require('pouchdb')
const Config = require('./Config')
const dbName = 'tms_routes'
const db = new PouchDB(dbName)
const remoteDB = new PouchDB( Config.remoteCouchDb + dbName, {
  auth: {
    username: 'tms',
    password: 'koputraPo5'
  }
})

const fetchData = async (info) => {
    const result = await db.allDocs({ include_docs: true })
    // console.log(result.rows.map(row => row.doc))
    console.log('CouchDb data fetched')
  }

const syncData = async () => {
    console.log('CouchDb sync' )
    PouchDB.sync(db, remoteDB, {
      live: true,
      retry: true
    }).on('paused', function (info) {
      // replication was paused, usually because of a lost connection
      console.log('CouchDb paused')
      console.log(info)
    }).on('active', function (info) {
      // replication was resumed
      console.log('CouchDb active')
    }).on('error', function (err) {
      // totally unhandled error (shouldn't happen)
      console.log('CouchDb error ' + err)
    }).on('change', async (info) => {
        console.log(info.direction)
        console.log(info.change)
            // fetchData()
    })
  }

syncData()
