//PM2 
//https://pm2.keymetrics.io/docs/usage/application-declaration/#attributes-available

module.exports = {
      apps : [{
      name   : "tms-api",
      script : "./server.js",
      instances: 1,
      exec_mode: 'cluster',
      env: { PORT: 3022 }
    }]
  }
  