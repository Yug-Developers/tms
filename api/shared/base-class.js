const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))
const axios = require('axios');
const Config = require('../Config')
const mes = require('./messenger')
const Token = require('./token-class')
const auth = Config.adminAuthCouchDb
const dbName = 'tms_statuses'

const remoteDB = new PouchDB(Config.remoteCouchDb + dbName, { auth })
const remoteUsersDB = new PouchDB(Config.remoteCouchDb + '_users', { auth })
const dbNameRoutes = 'tms_routes'
const remoteDBRoutes = new PouchDB(Config.remoteCouchDb + dbNameRoutes, { auth })

const getUsers = async (selector = {}) => {
  try {
    const result = await remoteUsersDB.find({ selector })
    return result.docs
  } catch (error) {
    return error
  }
}

const getUsersByCarrierId = async (carrierId) => {
  try {
    const result = await remoteUsersDB.find({
      selector: {
        carrierId: { $in: [carrierId] }
      }
    })
    return result.docs
  } catch (error) {
    console.error('Помилка при виконанні запиту:', error)
    throw error
  }
}

module.exports = {
  async sendReportEmail(data) {
    try {
      const token = await Token.create(1)
      const doc = await remoteDBRoutes.get(data._id)
      const editor = doc.addDriverId ? doc.addDriverId : doc.editorId
      const users = await getUsers({ typhoonId: String(editor) })
      const managers = await getUsersByCarrierId(String(doc.carrierId))
      const managersEmails = managers.map(manager => manager.email) || []
      if (managersEmails.length === 0) {
        managersEmails.push(Config.defaultManagerEmail)
      }
      subject = `[TMS] Рейс № ${data._id} - звіт про інкасацію`
      message = `
          <!DOCTYPE html>
          <body>
          <font face="Courier New" size="2">
          <p>Вітаємо,</p><br/>
          <p><b>Рейс № ${data._id} на ${this.formatDate(doc.date)} завершено.</b></p>
          <p>Відповідальний: ${users[0] && users[0].pib}</p><br/>
          <p>Початок: ${this.formatDateTime(data.startTime)}</p>
          <p>Завершення: ${this.formatDateTime(data.finishTime)}</p>
          <br/>
          <p>У вкладенні - звіт про проведену інкасацію.</p>
          </font>
          </body>
          `
      const fileName = '/var/www/node-shared-files/' + `tms_report_${data._id}.xlsx`
      const dataList = await this.createReportData(data)
      console.log('>>>>>>>>>>>>>>>dataList', dataList)

      if (dataList.length > 0) {
        await this.createExcelFile({
          fileName,
          options: [
            { name: 'Документ', col: 'docId', xml: "docId", default: true, width: 20 },
            { name: 'Контрагент', col: 'rcpt', xml: "rcpt", default: true, width: 50 },
            { name: '№ пакета', col: 'sumPack', xml: "sumPack", default: true, width: 20 },
            { name: 'Сума, грн (заявлена)', col: 'sum', xml: "sum", default: true, width: 30 },
            { name: 'Сума, грн (зі слів клієнта)', col: 'sumFact', xml: "sumFact", default: true, width: 30 },
            { name: 'Підключення', col: 'statusConnection', xml: "statusConnection", default: true },

          ],
          dataList,
          extendedCols: {}
        })
        console.log('Файл звіту про інкасацію створено')
        console.log('Відправка листа звіту про інкасацію')
        console.log({
          from: 'support@yugcontract.ua',
          to: managersEmails,
          cc: Config.defaultManagerEmail,
          subject,
          html: message,
          attachments: [
            {
              filename: `tms_report_${data._id}.xlsx`,
              path: fileName
            }],
          token
        })

        mes.sendMail({
          from: 'support@yugcontract.ua',
          to: managersEmails,
          cc: Config.defaultManagerEmail,
          subject,
          html: message,
          attachments: [
            {
              filename: `tms_report_${data._id}.xlsx`,
              path: fileName
            }],
          token
        })
      }
    }
    catch (error) {
      throw error
    }
  },
  async createReportData(data) {
    try {
      const tripDoc = await remoteDBRoutes.get(data._id)
      const tripPoints = {}
      tripDoc.points.forEach(point => {
        tripPoints[point.id] = point
      })
      const points = {}
      for (const point of data.points) {
        for (const doc of point.docs) {
          if (doc.sumFact && doc.sumPack) {

            points[point.id] = {
              docId: doc.id,
              rcpt: tripPoints[point.id].counterpartyName,
              sumPack: String(doc.sumPack),
              sumFact: doc.sumFact,
              statusConnection: doc.statusConnection ? 'Online' : 'Offline',
              sum: tripPoints[point.id].docs.find(d => d.id === doc.id).sum
            }
          }
        }
      }
      // передати points у вигляді масиву
      return Object.values(points)
    } catch (error) {
      throw error
    }
  },
  async closeDocInDb(id) {
    try {
      const doc = await remoteDBRoutes.get(id)
      doc.status = 'closed'
      await remoteDBRoutes.put(doc)
      //Відправити листа зі звітом про закриття документа
      console.log('++++Відправка листа звіту про закриття документа')
      await this.sendReportEmail(doc)
      console.log('!!!!!Лист звіту про закриття документа відправлено')
    } catch (error) {
      throw error
    }
  },
  async sendDataToTyphoon(data) {
    try {
      // console.log(JSON.stringify(data, null, 2));
      console.log('Відправка даних до Typhoon: --------------------------------------------------->');
      const authToken = await this.getAccessToken()
      const res = await axios({
        method: 'POST',
        data,
        url: `${Config.foxtrotApi.url}/trip-requests`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + authToken
        }
      })
      if (res.data.error) {
        throw new Error(res.data.error)
      } else {
        return res.data
      }
    } catch (error) {
      throw error
    }
  },
  async getAccessToken(sufix) {
    try {
      const path = 'foxtrotOauth2' + (sufix ? sufix : '')
      const { data } = await axios.post(
        Config[path].url,
        {
          client_id: Config[path].client_id,
          client_secret: Config[path].secret,
          grant_type: 'client_credentials'
        }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      return data.access_token

    } catch (error) {
      throw error
    }
  },
  prepareData(data) {
    const statusMap = {
      300: 1,
      400: 2,
      500: 3
    }
    const points = data.points
    // Змінюємо статуси документів в docs точок на відповідні для Т22
    points.forEach(point => {
      point.docs.forEach(doc => {
        doc.status = statusMap[doc.status]
      })
    })

    const out = {
      id: data._id,
      status: data.status,
      startTime: data.startTime,
      finishTime: data.finishTime,
      odometerStart: data.odometerStart,
      odometerFinish: data.odometerFinish,
      points
    }
    return out
  },
  createExcelFile({ fileName, options, dataList = [], extendedCols }) {
    return new Promise(async (resolve, reject) => {

      const authToken = await Token.create(1)
      const rows = []
      for (let rowData of dataList) {
        let row = []
        for (let col of options) {
          if (col.default || extendedCols[col.col]) {
            let value = rowData[col.col]
            if (col.execute) {
              value = col.execute(rowData, col)
            } else if (col.executeAsync) {
              value = await col.executeAsync(rowData, col)
            }
            row.push(value)
          }
        }
        rows.push(row)
      }

      const headerCols = []
      const columns = []
      for (let col of options) {
        if (col.default || extendedCols[col.col]) {
          headerCols.push(col.name)
          columns.push({ key: col.col, width: col.width || '25' })
        }
      }

      const xlsx = {
        fileName,
        workbook: {
          creator: 'Yugcontract Excel server',
          views: [{
            x: 0,
            y: 0,
            width: 10000,
            height: 20000,
            firstSheet: 0,
            activeTab: 0,
            visibility: 'visible'
          }]
        },
        worksheets: [{
          name: `Звіт про інкасацію`,
          properties: {
            tabColor: {
              argb: 'FFC0000'
            }
          },
          columns,
          header: {
            values: headerCols,
            style: {
              font: {
                name: 'Arial Black',
                size: 10,
              },
              border: {
                top: {
                  style: 'thin'
                },
                left: {
                  style: 'thin'
                },
                bottom: {
                  style: 'thin'
                },
                right: {
                  style: 'thin'
                }
              }
            },
            fill: {
              type: 'pattern',
              pattern: 'none',
            }
          },
          content: {
            style: {
              font: {
                name: 'Arial',
                size: 10
              }
            },
          },
          rows
        }]

      }
      try {
        const res = await axios({
          method: 'POST',
          url: (process.env.NODE_ENV ? 'https://xlsx.yugcontract.ua/api/create-xlsx-file' : 'http://dev.yugcontract.ua:3050/api/create-xlsx-file'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          data: xlsx,
          fileName
        })
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  },
  formatDateTime(isoString) {
    if (!isoString) {
      return ''
    }
    const date = new Date(isoString)
  
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0') // Місяці починаються з 0
    const year = date.getFullYear()
  
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
  
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
  },
  formatDate(dateString) {
    const [year, month, day] = dateString.split('-')
    return `${day}-${month}-${year}`
  }
}