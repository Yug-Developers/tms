const PouchDB = require('pouchdb')
PouchDB.plugin(require('pouchdb-find'))
const axios = require('axios');
const Config = require('../Config')
const mes = require('./messenger')
const Token = require('./token-class')
const Auth = require('./auth-class')
const auth = Config.adminAuthCouchDb
const remoteMailingDB = new PouchDB(Config.remoteCouchDb + 'tms_mailing', { auth })
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
  // E-mail з Розсилки ТМС з Перевізник = Перевізник рейсу ТА Звіт про інкасацію = ТАК.
  try {
    const result = await remoteMailingDB.find({
      selector: {
        carrierId: { $in: [carrierId] },
        isActive: { $eq: true }
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
      const managers = await getUsersByCarrierId(String(doc.carrierId))
      const managersEmails = managers.map(manager => manager.email) || []
      if (managersEmails.length === 0) {
        managersEmails.push(Config.defaultManagerEmail)
      }
      const currTime = new Date().toLocaleString()
      subject = `[TMS] Рейс № ${data._id} - звіт про інкасацію`
      message = `
          <!DOCTYPE html>
          <body>
          <font face="Courier New" size="2">
          Вітаємо,<br/><br/>
          <b>Рейс № ${data._id} на ${this.formatDate(doc.date)} завершено.</b><br/>
          Відповідальний: ${doc.editorName}<br/><br/>
          Початок: ${this.formatDateTime(data.startTime)}<br/>
          Завершення завдання рейсу: ${this.formatLocalTime(currTime)}<br/>
          <br/>
          У вкладенні - звіт про проведену інкасацію.
          </font>
          </body>
          `
      const fileName = '/var/www/node-shared-files/' + `tms_report_${data._id}.xlsx`
      const dataList = await this.createReportData(data)

      if (dataList.length > 0) {
        await this.createExcelFile({
          title: 'Звіт про інкасацію',
          fileName,
          options: [
            // { name: 'Документ', col: 'docId', xml: "docId", default: true, width: 20 },
            { name: 'Контрагент', col: 'rcpt', xml: "rcpt", default: true, width: 50 },
            { name: '№ пакета', col: 'sumPack', xml: "sumPack", default: true, width: 20 },
            { name: 'Сума, грн (заявлена)', col: 'sum', xml: "sum", default: true, width: 30 },
            { name: 'Сума, грн (зі слів клієнта)', col: 'sumFact', xml: "sumFact", default: true, width: 30 },
            { name: 'Підключення', col: 'statusConnection', xml: "statusConnection", default: true },

          ],
          dataList,
          extendedCols: {}
        })
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

        await mes.sendMail({
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
          const sum = tripPoints[point.id]?.docs?.find(d => d.id === doc.id)?.sum || 0
          if (sum >= 0 && doc.sumPack !== null) {
            if(!points[point.id]) {
              points[point.id] = {}
            }
            if(!Array.isArray(points[point.id][doc.sumPack])) {
              points[point.id][doc.sumPack] = []
            }
            points[point.id][doc.sumPack].push({
              docId: doc.id,
              rcpt: tripPoints[point.id].counterpartyName,
              sumPack: String(doc.sumPack),
              sumFact: doc.sumFact,
              statusConnection: doc.statusConnection ? 'Online' : 'Offline',
              sum
            })
          }
        }
      }
      // просумувати усі суми по кожному пакету sumFact та sum
      for (const point in points) {
        for (const pack in points[point]) {
          const sumFact = points[point][pack].reduce((acc, curr) => acc + curr.sumFact, 0)
          const sum = points[point][pack].reduce((acc, curr) => acc + curr.sum, 0)
          points[point][pack] = {
            docId: points[point][pack].map(doc => doc.docId).join(', '),
            rcpt: points[point][pack][0].rcpt,
            sumPack: points[point][pack][0].sumPack,
            sumFact,
            statusConnection: points[point][pack][0].statusConnection,
            sum
          }
        }
      }
      // передати points у вигляді масиву
      return Object.values(points).reduce((acc, curr) => acc.concat(Object.values(curr)), [])
    } catch (error) {
      throw error
    }
  },
  async closeDocInDb(data) {
    try {
      const id = data._id
      const doc = await remoteDBRoutes.get(id)
      doc.status = 'closed'
      await remoteDBRoutes.put(doc)
    } catch (error) {
      throw error
    }
  },
  async sendDataToTyphoon(data) {
    try {
      // console.log(JSON.stringify(data, null, 2));
      // відправляємо дані тільки в продакшені
      if (process.env.NODE_ENV !== 'production') {
        return
      }
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
  createExcelFile({ title, fileName, options, dataList = [], extendedCols }) {
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
          name: title,
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
    const localISOString = isoString.replace('Z', '')
    const date = new Date(localISOString)

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
  },
  formatLocalTime(localDateString) {
    const date = new Date(localDateString)

    // Отримуємо компоненти дати та часу
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0') // Місяці починаються з 0
    const year = date.getFullYear()

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    // Формуємо рядок у потрібному форматі
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
  },
  sendManagersReportEmail(data) {
    return new Promise(async (resolve, reject) => {
      try {
        const token = await Token.create(1)
        const doc = await remoteDBRoutes.get(data._id)
        const currTime = new Date().toLocaleString()
        const dataList = await this.createManagersReportData(data)
        for (const email in dataList) {
          let table = `
          <table border="1" cellpadding="5" cellspacing="0" style="font-family: 'Courier New'; font-size: 12px;"> 
          <tr style="background-color: #f0f0f0;">
            <th>Документ №</th>
            <th>Контрагент</th>
            <th>Адреса</th>
            <th>Вантажоодержувач</th>
            <th>Тип завдання</th>
            <th>Кор/Пал</th>
            <th>Сума, грн</th>
            <th>Статус доставки</th>
            <th>Коментар до статусу</th>
            <th>Кор/Пал факт</th>
            <th>№ пакета</th>
            <th>Сума, грн (зі слів клієнта)</th>
            <th>Підключення</th>
          </tr>
          `
          for (const row of dataList[email]) {
            const colorized = row.boxQty !== row.boxesFact || row.pallQty !== row.palletsFact || row.sum !== row.sumFact || row.status !== 'Отримано' ?
              'style="background-color: #ffcccc;"' : ''
            table += `
            <tr ${colorized}>
              <td>${row.id}</td>
              <td>${row.contractor}</td>
              <td>${row.address}</td>
              <td>${row.rcpt}</td>
              <td>${row.docType}</td>
              <td>${row.boxQty}/${row.pallQty}</td>
              <td>${row.sum}</td>
              <td>${row.status}</td>
              <td>${row.description}</td>
              <td>${row.boxesFact}/${row.palletsFact}</td>
              <td>${row.sumPack}</td>
              <td>${row.sumFact}</td>
              <td>${row.statusConnection}</td>
            </tr>
            `
          }
          table += '</table>'

          subject = `[TMS] Рейс № ${data._id} - Звіт про виконання рейса`
          message = `
              <!DOCTYPE html>
              <body>
              <font face="Courier New" size="2">
              Вітаємо,<br/><br/>
              <b>Рейс № ${data._id} на ${this.formatDate(doc.date)} завершено.</b><br/>
              Відповідальний: ${doc.editorName}<br/><br/>
              Початок: ${this.formatDateTime(data.startTime)}<br/>
              Завершення завдання рейсу: ${this.formatLocalTime(currTime)}<br/>
              <br/>
              ${table}
              </font>
              </body>
              `

          console.log('Відправка листа звіту про виконання рейса')
          const managerEmail = email || Config.defaultManagerEmail
          console.log('managers', managerEmail)

          console.log({
            from: 'support@yugcontract.ua',
            to: managerEmail,
            cc: Config.defaultManagerEmail,
            subject,
            token
          })

          await mes.sendMail({
            from: 'support@yugcontract.ua',
            to: managerEmail,
            cc: Config.defaultManagerEmail,
            subject,
            html: message,
            token
          })
        }
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  },
  async createManagersReportData(data) {
    try {
      const tripDoc = await remoteDBRoutes.get(data._id)
      const token = await Token.create(1)
      const tripPoints = {}
      tripDoc.points.forEach(point => {
        tripPoints[point.id] = point
      }
      )
      // console.log(JSON.stringify(data, null, 2))
      const points = {}
      for (const point of data.points) {
        for (const doc of point.docs) {
          const routeDoc = tripPoints[point.id].docs.find(d => d.id === doc.id)
          if (!routeDoc) {
            continue
          }
          const typesObj = {
            out: 'Видачі',
            in: 'Повернення',
            task: 'Завдання'
          }
          const documentStatusObj = {
            100: 'Новий',
            200: 'У дорозі',
            300: 'Отримано',
            400: 'Відмова',
            500: 'Скасовано',
          }

          const contractorId = tripPoints[point.id].counterpartyId || -1
          const managersEmails = await Auth.getContractorsManagers({ contractorId, token })
          for (const email of managersEmails) {
            if (!points[email]) {
              points[email] = []
            }
              points[email].push({
              rcpt: tripPoints[point.id].rcpt + ' ' + tripPoints[point.id].rcptPhone,
              address: tripPoints[point.id].address + (tripPoints[point.id].description ? ' (' + tripPoints[point.id].description + ')' : ''),
              docType: typesObj[routeDoc.docType] || 'Невідомo',
              boxQty: routeDoc.boxQty,
              pallQty: routeDoc.pallQty,
              sum: routeDoc.sum || 0,
              status: documentStatusObj[doc.status] || 'Невідомо',
              description: doc.description || '',
              boxesFact: doc.boxesFact,
              palletsFact: doc.palletsFact,
              sumPack: doc.sumPack || 0,
              sumFact: doc.sumFact,
              statusConnection: doc.statusConnection ? 'Online' : 'Offline',
              contractor: tripPoints[point.id].counterpartyName,
              id: doc.id
            })
          }
        }
      }
      return points
    } catch (error) {
      throw error
    }
  }
}
