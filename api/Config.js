module.exports = {
  remoteCouchDb: process.env.NODE_ENV === 'production' ? 'https://tms-db.yugcontract.ua/' :
    (process.env.NODE_ENV === 'dev_production' ? 'https://dev.tms-db.yugcontract.ua/' : 'http://dev.tms.yugcontract.ua:5984/'),
  adminAuthCouchDb: {
    username: 'admin',
    password: 'defred098'
  },
  misUrl: process.env.NODE_ENV === 'production' ? 'https://mis.yugcontract.ua/api' :
    (process.env.NODE_ENV === 'dev_production' ? 'https://dev.mis.yugcontract.ua/api' : 'http://dev.mis.yugcontract.ua:4040/api'),
  foxtrotOauth2: {
    client_id: 'yugcontract-client',
    secret: 'd260a147-bada-4f04-9e6f-639f31fdd736',
    url: 'https://auth-prod.foxtrot.ua/realms/foxtrot/protocol/openid-connect/token',
  },
  foxtrotOauth2_test: {
    client_id: 'yugcontract-client',
    secret: '7615ecad-05b3-49a9-9c92-c75a7bb2833a',
    url: 'https://auth-test.foxtrot.ua/realms/foxtrot/protocol/openid-connect/token',
  },
  foxtrotApi: {
    url: 'http://api-yk.prod.k8s.mc.gcf/api'
  },
  foxtrotApi_test: {
    url: 'http://api-yk.test.k8s.mc.gcf/api'
  },
  messengerMs: {
    url: process.env.NODE_ENV === 'production' ? 'https://messenger.yugcontract.ua/api' : 'http://dev.yugcontract.ua:3077/api',
    alphaName: 'YUGcontract',
    tag: 'TMS',
  },
  debugEmail: "kuzminetskiy-a@yugcontract.ua",
  // debugEmail: "tanya-ka@yugcontract.ua",
  defaultManagerEmail: "tanya-ka@yugcontract.ua",
  jwt: {
    secret: 'jlkjasd23032mlm342kjklj241lkjlkjlj243',
    expire: 300 * 60
  },
  getAuthB2BUrl: (process.env.NODE_ENV === 'dev_production' || process.env.NODE_ENV === 'production' ? 'https://b2b.yugcontract.ua' : 'http://dev.yugcontract.ua:3033') + '/api/auth',

}