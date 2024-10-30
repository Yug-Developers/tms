module.exports = {
    remoteCouchDb: process.env.NODE_ENV === 'production' ? 'https://tms-db.yugcontract.ua/' :  
    (process.env.NODE_ENV === 'dev_production' ? 'https://dev.tms-db.yugcontract.ua/' : 'http://dev.tms.yugcontract.ua:5984/'),
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
    
}