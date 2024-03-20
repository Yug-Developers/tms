module.exports = {
    remoteCouchDb: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'dev_production' ? 
    'https://dev.sharp.com.ua/' : 'http://dev.tms.yugcontract.ua:5984/',
    remoteCouchDbAuth: {
        username: 'tms',
        password: 'koputraPo5'
    }
}