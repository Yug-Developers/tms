const mysql = require('mysql');

const state = {}
const defaultdbName = 'intranet2';

const dbOptions = {
    intranet2: {
        connectionLimit: process.env.NODE_ENV == 'production' ? 10 : 3,
        host: 'db.yugcontract.ua',
        user: 'intranet',
        password: 'jeeP4a',
        database: 'intranet2',
        debug: process.env.DB_DEBUG
    },
    mes: {
        host: 'db.yugcontract.ua',
        database: 'cms_empty',
        user: 'cms_empty',
        password: 'WVCNfGecnjnf',
    },
};

const cnt = (nameDB) => {
    return new Promise((resolve, reject) => {
        state[nameDB] = mysql.createPool(dbOptions[nameDB]);
        if (state[nameDB]) {
            resolve(state[nameDB])
        }
    })
}

exports.connect = new Promise(async (resolve, reject) => {
    for (let nameDB in dbOptions) {
        try {
            await cnt(nameDB)
        } catch (err) {
            reject(err)
        }
    }
    resolve()
})

exports.get = (Db = defaultdbName) => state[Db];

