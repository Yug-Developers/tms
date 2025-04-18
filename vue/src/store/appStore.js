// This file contains the store for the app
import { defineStore } from 'pinia'
import { ref, reactive, computed, watch } from 'vue'
import { usePouchDB } from '@/hooks/PouchDb'
import useGeolocation from '@/hooks/geolocation'
import axios from 'axios'
import Config from '@/Config'
import md5 from 'md5'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { useOnlineStatus } from '@/hooks/onlineStatus'
import { HTTP } from '@/http-common'

// ініціалізація локального сховища
const localStg = useLocalStorage({
  'userData': {},
  'stats': {},
  'user_name': '',
  'user_id': '',
  'token': '',
  'deviceId': '',
  'cameraId': '',
})

const { location, locationError, getLocation } = useGeolocation();
const Pouch = usePouchDB()

export const useAppStore = defineStore('appStore', () => {
  const { updateOnlineStatus } = useOnlineStatus()
  // --------------------------------- state ----------------------------------
  const online = ref(navigator.onLine)
  const offline = ref(false)
  const connection = ref(navigator.connection?.effectiveType)
  const isSecureConnection = window.location.protocol === "https:"
  const loading = ref(false)
  const skipSync = ref(false)
  const snackbar = reactive({
    timeout: 4000,
    text: '',
    model: false,
    color: 'accent-darken1',
    icon: 'done_outline',
  })
  const data = reactive({})
  const statuses = ref([])
  const routes = ref([])
  const navigationDrawerRightShow = ref(false)
  const finishedOdometerData = ref(null)
  const availableTripsIds = ref([])
  // const tripsCounter = ref(null)
  const tripsByDate = ref([])
  const inplaceLoading = ref(false)
  // флаги оновлення даних
  const lastRoutesSeq = ref(0)
  const lastStatusesSeq = ref(0)
  const lastLocalStatusesSeq = ref(0)
  const lastLocalManagersPerlSeq = ref(0)

  const menuItems = ref([
    { title: 'Головна', icon: 'mdi-home', to: '/' },
    { title: 'Рейси', icon: 'mdi-routes', to: '/trips' },
  ])

  const tripStatusObj = {
    0: 'Чернетка',
    100: 'Новий',
    200: 'У роботі',
    300: 'Завершений',
  }

  const pointStatusObj = {
    100: 'Нова',
    200: 'У роботі',
    300: 'Завершено',
  }

  const documentStatusObj = {
    100: 'Новий',
    200: 'У дорозі',
    300: 'Отримано', //Видано
    400: 'Відмова',
    500: 'Скасовано',
  }

  const carriers = [
    { title: 'Юг-Контракт КИЕВ', value: '4' },
    { title: 'Юг-Контракт Львов', value: '132' },
    { title: 'Юг-Контракт Днепропетровск', value: '112' },
    { title: 'Юг-Контракт Черновцы', value: '114' },
    { title: 'Юг-Контракт Чернигов', value: '117' },
    { title: 'Юг-Контракт Черкассы', value: '123' },
    { title: 'Юг-Контракт Херсон', value: '118' },
    { title: 'Юг-Контракт Харьков', value: '110' },
    { title: 'Юг-Контракт Ужгород', value: '163' },
    { title: 'Юг-Контракт Тернополь', value: '115' },
    { title: 'Юг-Контракт Сумы', value: '158' },
    { title: 'Юг-Контракт Полтава', value: '116' },
    { title: 'Юг-Контракт Одесса', value: '108' },
    { title: 'Юг-Контракт Николаев', value: '119' },
    { title: 'Юг-Контракт Луцк', value: '120' },
    { title: 'Юг-Контракт Кривой Рог', value: '161' },
    { title: 'Юг-Контракт Кировоград', value: '160' },
    { title: 'Юг-Контракт Ивано-Франковск', value: '162' },
    { title: 'Юг-Контракт Запорожье', value: '111' },
    { title: 'Юг-Контракт Донецк', value: '98' },
    { title: 'Юг-Контракт Винница', value: '122' },
    { title: 'ЮК наемный транспорт', value: '71' }
  ]
  // --------------------------------- functions ------------------------------

  const formatDate = (date) => {
    if (!date) return null
    const [year, month, day] = date.split('-')
    return `${day}-${month}-${year}`
  }

  const formatDateTime = (isoString) => {
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
  }

  // --------------------------------- getters --------------------------------
  const setSnackbar = (config = {}) => {
    const snackbarDefaults = {
      success: {
        color: 'success',
        icon: 'mdi-check-outline',
        text: ''
      },
      info: {
        color: 'info',
        icon: 'mdi-information-outline',
        text: ''
      },
      error: {
        color: 'error',
        icon: 'mdi-alert-octagon-outline',
        text: 'Помилка! '
      },
      warning: {
        color: 'warning',
        icon: 'mdi-alert-outline',
        text: 'Увага! '
      },
    }
    Object.assign(snackbar, {
      ...snackbarDefaults[config.type],
      text: snackbarDefaults[config.type].text.concat(config.text),
      model: true
    })
  }
  // --------------------------------- mis ------------------------------------

  const checkPhone = async (phone) => {
    try {
      const res = await HTTP.post('/tms/check-phone', { phone })
      return res.data

    } catch (error) {
      throw error
    }
  }

  const resetPassword = async (data) => {
    try {
      const res = await HTTP.post('/tms/reset-password', data)
      return res.data
    } catch (error) {
      throw error
    }
  }

  const checkRecaptcha = async (token) => {
    try {
      const res = await HTTP.post('/tms/check-recaptcha', { token })
      return res.data
    } catch (error) {
      throw error
    }
  }

  const getTmsTripsById = async (id) => {
    try {
      const res = await HTTP.post('/tms/get-tms-trips-by-id', { id })
      return res.data
    } catch (error) {
      throw error
    }
  }

  const checkTmsTripsProcess = async () => {
    //check-tms-trips-process
    try {
      const res = await HTTP.post('/tms/check-tms-trips-process')
      return res.data
    } catch (error) {
      throw error
    }
  }

  const checkQrCode = async (code) => {
    try {
      const res = await HTTP.post('/tms/check-qr-code', { code })
      return res.data
    } catch (error) {
      throw error
    }
  }

  const getStats = async () => {
    try {
      if (offline.value) return localStg.stats
      const res = await HTTP.get('/tms/get-stats')
      if (res?.data?.content) localStg.stats = res.data.content
      return res?.data?.content || {}
    } catch (error) {
      throw error
    }
  }

  const getAllAvailableTrips = async () => {
    // Для розділу - рейси
    try {
      if (offline.value) return []
      const res = await HTTP.get('/tms/get-all-available-trips')
      const out = res.data?.content || []
      tripsByDate.value = out
      return out.map(trip => trip.id)
    } catch (error) {
      throw error
    }
  }

  const availableTrips = computed(() => {
    return tripsByDate.value.map(trip => trip.id)
  })

  const pullRoutes = async (ids) => {
    try {
      if (offline.value) return
      const res = await HTTP.get(`/tms/pull-routes?since=${lastRoutesSeq.value}${ids?.length ? ('&ids=' + ids) : ''}`)
      const data = res.data?.content || {}
      if (data?.docs.length > 0) {
        await Pouch.bulkDocs('routes', data.docs)
        lastRoutesSeq.value = data.last_seq // Оновлюємо позицію змін
      }
      return data
    } catch (error) {
      throw error
    }
  }

  const pullStatuses = async (ids) => {
    try {
      if (offline.value) return
      const res = await HTTP.get(`/tms/pull-statuses?${ids?.length ? ('&ids=' + ids) : ``}`)
      const data = res.data?.content || {}
      if (data?.docs.length > 0) {
        const res = await Pouch.bulkDocs('statuses', data.docs)
        lastStatusesSeq.value = data.last_seq // Оновлюємо позицію змін
        const changes = await Pouch.changes('statuses', {
          since: lastLocalStatusesSeq.value || 0, // Отримуємо тільки нові зміни
          include_docs: true
        })
        lastLocalStatusesSeq.value = changes.last_seq
        }
      return data
    } catch (error) {
      throw error
    }
  }

  const pullManagersPerm = async (ids) => {
    try {
      if (offline.value) return
      const res = await HTTP.get(`/tms/pull-manager-perm?ids=${ids}`)
      const data = res.data?.content || {}
      if (data?.docs.length > 0) {
        const res = await Pouch.bulkDocs('manager_perm', data.docs)
      }
      return data
    } catch (error) {
      throw error
    }
  }

  const pushStatusesData = async () => {
    try {
      if (localStg.userData.role !== 'driver') return
      if (offline.value) return
      const changes = await Pouch.changes('statuses', {
        since: lastLocalStatusesSeq.value || 0, // Отримуємо тільки нові зміни
        include_docs: true
      })
      if (changes.results.length === 0) return
      const docs = changes.results.map(row => row.doc)
      const res = await HTTP.post('/tms/push-statuses', { docs })
      lastLocalStatusesSeq.value = changes.last_seq
      return res.data
    } catch (error) {
      throw error
    }
  }

  const pushManagerPermData = async () => {
    try {
      if (localStg.userData.role !== 'manager') return
      if (offline.value) return
      const changes = await Pouch.changes('manager_perm', {
        since: lastLocalManagersPerlSeq.value || 0, // Отримуємо тільки нові зміни
        include_docs: true
      })
      if (changes.results.length === 0) return
      const docs = changes.results.map(row => row.doc)
      const res = await HTTP.post('/tms/push-manager-perm', { docs })
      lastLocalManagersPerlSeq.value = changes.last_seq
      return res.data
    } catch (error) {
      throw error
    }
  }

  const extractPhoneNumber = (input) => {
    const phoneRegex = /\+?\s*3\s*8/g
    const barePhone = input.replace(/\D/g, '')
    if (input.match(phoneRegex)) {
      const res = barePhone.slice(2, 12)
      return res.length === 10 ? '38' + res : null
    } else {
      const res = barePhone.slice(0, 10)
      return res.length === 10 ? '38' + res : null
    }
  }

  const parsePhones = (input) => {
    if (!input) {
      return []
    }
    return Array.from(
      new Set(
        input
          .split(',')
          .filter(phone => phone) // Видалити пусті телефони
          .map(phone => phone.trim()) // Видалити зайві пробіли
          .map(phone => phone.startsWith('+') ? phone : `+${phone}`) // Додати "+" до телефонів без нього
      )
    )
  }

  const sendSMScode = async ({ phone, message }) => {
    try {
      const phoneNum = extractPhoneNumber(phone)
      if (!phoneNum) {
        throw new Error(`Номер телефону "${phone}" вказано невірно`)
      }
      //Відправка смс тільки в режимі продакшен
      if (process.env.NODE_ENV !== 'production') {
        return {} //Якщо не продакшен, то просто повертаємо пустий об'єкт
      }
      const res = await HTTP.post('/tms/send-sms', {
        phone: phoneNum,
        message,
        alpha_name: Config.messengerMs.alphaName,
        tag: Config.messengerMs.tag
      })
      return res.data
    } catch (error) {
      throw error
    }
  }

  const touch = async () => {
    try {
      if (offline.value) return true
      await HTTP.get('/tms/touch')
      return true
    } catch (error) {
      throw error
    }
  }

  // --------------------------------- actions --------------------------------
  const createCode = (phone) => {
    const code = process.env.NODE_ENV === 'production' ? parseInt(Math.random() * 10000).toString().padStart(4, '0') : '1111'
    const hash = md5(code)
    return [code, hash]
  }

  //------------------------ login logout ----------------------------------
  const login = async (user, pass) => {
    try {
      await clearDB()
    } catch (error) {
      console.error(error)
    }
    clearVars()
    try {
      skipSync.value = true
      await updateOnlineStatus()
      return await Pouch.login(user, pass)
    } catch (error) {
      throw error
    }
  }

  const netLogin = async (user, pass, reCAPTCHA, deviceId) => {
    try {
      if (offline.value) return
      clearVars()
      const res = await axios.post(Config.authUrl + `/auth/login`, { user, pass, reCAPTCHA, deviceId })
      return res.data
    } catch (error) {
      throw error
    }
  }


  const logout = async () => {
    try {
      clearVars()
      try {
        await clearDB()
      } catch (error) {
        console.error(error)
      }
      return
    } catch (error) {
      throw error
    }
  }
  const clearVars = () => {
    localStg.userData = {}
    localStg.user_name = ''
    localStg.user_id = ''
    localStg.stats = {}
    localStg.token = ''

    lastRoutesSeq.value = 0
    lastStatusesSeq.value = 0
    lastLocalStatusesSeq.value = 0
    lastLocalManagersPerlSeq.value = 0
  }

  const clearDB = async () => {
    try {
      await Pouch.destroyDB('statuses')
      await Pouch.destroyDB('routes')
      await Pouch.destroyDB('users')
      await Pouch.destroyDB('manager_perm')
    } catch (error) {
      throw error
    }
  }

  // ---------------------- реплікація -----------------------------------
  const pullTripsData = async () => {
    try {
      loading.value = true
      if (!offline.value) {
        // Репликація маршрутів
        await pullRoutes()
        routes.value = await Pouch.fetchData('routes')
        const doc_ids = activeTripsIds.value
        if (doc_ids.length === 0) doc_ids.push('-1')

        // Репликація статусів
        await pullStatuses(doc_ids)

        // Репликація дозволів менеджера
        await pullManagersPerm(doc_ids)

        statuses.value = await Pouch.fetchData('statuses')
      } else {
        routes.value = await Pouch.fetchData('routes')
        statuses.value = await Pouch.fetchData('statuses')
      }
      loading.value = false
    } catch (error) {
      throw error
    }
  }

  const pullTripsById = async (ids) => {
    try {
      if (!offline.value) {
        await pullRoutes(ids)
        await pullStatuses(ids)
        await pullManagersPerm(ids)
      }
      routes.value = await Pouch.fetchData('routes')
      statuses.value = await Pouch.fetchData('statuses')
    } catch (error) {
      throw error
    }
  }


  // ---------------------- робота з локальними даними ---------------------

  const getTripDoc = async (tripId) => {
    try {
      return await Pouch.getDoc('routes', tripId)
    } catch (error) {
      return {}
    }
  }

  const getManagerPermDoc = async (tripId) => {
    try {
      return await Pouch.getDoc('manager_perm', tripId)
    } catch (error) {
      return {}
    }
  }


  const getTripStatusesDoc = async (tripId) => {
    try {
      const statuses = await Pouch.getDoc('statuses', tripId)
      return statuses
    } catch (error) {
      return {}
    }
  }

  const checkOpenTrip = async (tripId) => {
    try {
      const statuses = await Pouch.fetchData('statuses')
      return statuses.find(status => status.status === 200 && status._id != tripId) ? true : false
    } catch (error) {
      return false
    }
  }

  const activeTrips = computed(() => {
    return routes.value.filter(status => status.status === 'active')
  })

  const activeTripsIds = computed(() => {
    return activeTrips.value.map(trip => trip._id)
  })

  const activeStatuses = computed(() => {
    return statuses.value.filter(status => status.status === 200)
  })

  const closedStatuses = computed(() => {
    return statuses.value.filter(status => status.status === 300)
  })

  const closedStatusesIds = computed(() => {
    return closedStatuses.value.map(status => status._id)
  })

  const activeStatusesIds = computed(() => {
    return activeStatuses.value.map(status => status._id)
  })

  const routesIds = computed(() => {
    return routes.value.map(trip => trip._id)
  })

  const statusesIds = computed(() => {
    return statuses.value.map(status => status._id)
  })

  // --------------------------- дозволи менеджера ------------------------------
  const setSMSstatus = async (tripId, pointId) => {
    try {
      const res = await Pouch.updateDontSendSMS('manager_perm', tripId, pointId)
      await pushManagerPermData()
      return res
    } catch (error) {
      throw error
    }
  }

  // --------------------------- статуси рейсів ------------------------------

  const initNewTripStatus = async (tripId, config) => {
    try {
      const doc = await getTripDoc(tripId)
      const points = []
      for (let point of doc?.points) {
        const cPoint = {}
        if (point.sortNumber == 1) {
          cPoint.id = point.id
          cPoint.status = 200
          cPoint.arrivalTime = getCurrentTime()
          try {
            if (isSecureConnection) {
              await getLocation()
              cPoint.coordinates = location.value
            } else {
              cPoint.coordinates = { latitude: '', longitude: '' }
            }
          } catch (error) {
            cPoint.coordinates = { latitude: '', longitude: '' }
          }
        } else {
          cPoint.id = point.id
          cPoint.status = 100
        }
        cPoint.docs = []
        for (let doc of point.docs) {
          cPoint.docs.push({
            id: doc.id,
            status: 200,
            sumPack: null,
            sumFact: 0,
            palletsFact: 0,
            boxesFact: 0
          })
        }
        points.push(cPoint)
      }
      if (doc.isCircular || doc.circular) {
        points.push({ id: -1, status: 100, docs: [] })
      }
      const data = {
        _id: tripId,
        status: 200,
        startTime: getCurrentTime(),
        odometerStart: config.odometerStart,
        points
      }
      const res = await Pouch.putData('statuses', data)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const cancelPoint = async (tripId, pointId) => {
    try {
      const st = await Pouch.getDoc('statuses', tripId)
      const trip = await Pouch.getDoc('routes', tripId)
      const points = st.points
      for (let point of points) {
        if (point.id === pointId) {
          const cpoint = trip.points.find(point => point.id === pointId) || {}
          if (cpoint.sortNumber == 1) {
            const res = await Pouch.deleteDoc('statuses', tripId)
            statuses.value = await Pouch.fetchData('statuses')
            await pushStatusesData()
            return
          }
          point.status = 100
          point.arrivalTime = ''
          delete point.coordinates
        }
      }
      Object.assign(st, { points })
      delete st._id
      delete st._rev
      const res = await Pouch.updateDoc('statuses', tripId, st)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const checkPointDocs = async (tripId, pointId) => {
    //Якщо у Точки доставки всі документи мають status <> Отримано, Відмова, Скасовано
    const st = await Pouch.getDoc('statuses', tripId) || {}
    const point = st.points.find(point => point.id === pointId)
    const docs = point.docs || []
    for (let doc of docs) {
      if (doc.status > 200) {
        return false
      }
    }
    return true
  }

  const checkEmptyPointDocsExists = async (tripId) => {
    //Якщо Рейс має Статус = Новий (пустий документ статусу) ТА у Рейсі є хоч один документ з Тип = Видача (out) ТА Кор = 0 ТА Пал = 0, то видати помилку: "Видача без коробок та палет"
    let statusFile = true
    try {
      await Pouch.getDoc('statuses', tripId)
    } catch (error) {
      statusFile = false
    }
    const trip = await Pouch.getDoc('routes', tripId)
    if (!statusFile && trip.status === 'active') {
      for (let point of trip.points) {
        for (let doc of point.docs) {
          if (doc.docType === 'out' && doc.boxQty === 0 && doc.pallQty === 0) {
            console.log('Видача без коробок та палет', doc.id)
            return true
          }
        }
      }
    }
    return false
  }

  const isThisWhPoint = async (tripId, pointId) => {
    // Перевіряємо, чи точка є складом та перша у списку точок
    const doc = await getTripDoc(tripId)
    return doc.points.find(point => point.id === pointId && point.sortNumber == 1 && point.pointType == 'wh') ? true : false
  }

  const inPlace = async (tripId, pointId) => {
    try {
      const doc = await getTripDoc(tripId)
      const tripPoints = doc.points
      const st = await Pouch.getDoc('statuses', tripId)
      const currentPoint = tripPoints.find(point => point.id === pointId)
      const points = st.points
      for (let point of points) {
        if (point.id === pointId) {
          point.status = 200
          point.arrivalTime = getCurrentTime()
          try {
            if (isSecureConnection) {
              await getLocation()
              point.coordinates = location.value
            } else {
              point.coordinates = { latitude: '', longitude: '' }
            }
          } catch (error) {
            point.coordinates = { latitude: '', longitude: '' }
          }
          point.docs = []
          if (pointId !== -1) {
            for (let doc of currentPoint.docs) {
              point.docs.push({
                id: doc.id,
                status: 200,
                sumPack: null,
                sumFact: 0,
                palletsFact: 0,
                boxesFact: 0
              })
            }
          }
        }
      }
      Object.assign(st, { points })
      delete st._id
      delete st._rev
      await Pouch.updateDoc('statuses', tripId, st)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const releaseDoc = async (config) => {
    try {
      const st = await Pouch.getDoc('statuses', config.tripId)
      const points = st.points
      for (let point of points) {
        if (point.id === config.pointId) {
          const docs = point.docs
          for (let doc of docs) {
            if (doc.id === config.docId) {
              doc.status = 300
              doc.sumPack = config.sumPack
              doc.sumFact = config.sumFact
              doc.palletsFact = config.palletsFact
              doc.boxesFact = config.boxesFact
              doc.statusConnection = !offline.value
              if (config.rcptQR) {
                doc.rcptQR = config.rcptQR
              }
            }
          }
        }
      }
      Object.assign(st, { points })
      delete st._id
      delete st._rev
      const res = await Pouch.updateDoc('statuses', config.tripId, st)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const rejectDoc = async (config) => {
    try {
      const st = await Pouch.getDoc('statuses', config.tripId)
      const points = st.points
      for (let point of points) {
        if (point.id === config.pointId) {
          const docs = point.docs
          for (let doc of docs) {
            if (doc.id === config.docId) {
              doc.status = 400
              doc.description = config.description
              doc.statusConnection = !offline.value
            }
          }
        }
      }
      Object.assign(st, { points })
      delete st._id
      delete st._rev
      const res = await Pouch.updateDoc('statuses', config.tripId, st)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const cancelDoc = async (config) => {
    try {
      const st = await Pouch.getDoc('statuses', config.tripId)
      const points = st.points
      for (let point of points) {
        if (point.id === config.pointId) {
          const docs = point.docs
          for (let doc of docs) {
            if (doc.id === config.docId) {
              doc.status = 500
              doc.description = config.description
              doc.statusConnection = !offline.value
            }
          }
        }
      }
      Object.assign(st, { points })
      delete st._id
      delete st._rev
      const res = await Pouch.updateDoc('statuses', config.tripId, st)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const completePoint = async (tripId, pointId) => {
    try {
      const st = await Pouch.getDoc('statuses', tripId)
      const points = st.points
      for (let point of points) {
        if (point.id === pointId) {
          point.status = 300
          point.departureTime = getCurrentTime()
        }
      }
      Object.assign(st, { points })
      delete st._id
      delete st._rev
      const res = await Pouch.updateDoc('statuses', tripId, st)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const completeTrip = async (tripId, config) => {
    try {
      const st = await Pouch.getDoc('statuses', tripId)
      st.status = 300
      st.finishTime = getCurrentTime()
      st.odometerFinish = config.odometerFinish
      delete st._id
      delete st._rev
      const res = await Pouch.updateDoc('statuses', tripId, st)
      statuses.value = await Pouch.fetchData('statuses')
      await pushStatusesData()
    } catch (error) {
      throw error
    }
  }

  const getCurrentTime = () => {
    const now = new Date()
    const offset = now.getTimezoneOffset() // Різниця в хвилинах між UTC та локальним часом
    const localTime = new Date(now.getTime() - offset * 60 * 1000).toISOString()
    const localISOString = localTime.replace('Z', '')
    return localISOString
  }

  return {
    snackbar, setSnackbar, online, data, statuses, navigationDrawerRightShow, menuItems, loading,
    checkOpenTrip, pullTripsData, initNewTripStatus, cancelPoint, inPlace, checkPointDocs, releaseDoc, rejectDoc, cancelDoc,
    getTripDoc, getTripStatusesDoc, tripStatusObj, pointStatusObj, documentStatusObj, completePoint, completeTrip, sendSMScode,
    createCode, login, logout, carriers, checkPhone, resetPassword,
    pushStatusesData, checkRecaptcha, formatDate, localStg, getTmsTripsById, checkTmsTripsProcess,
    setSMSstatus, getManagerPermDoc, checkQrCode, extractPhoneNumber, parsePhones, checkEmptyPointDocsExists, connection, offline, skipSync,
    formatDateTime, routes, pullTripsById, activeTrips, activeStatuses,
    activeTripsIds, activeStatusesIds, availableTripsIds, closedStatuses, closedStatusesIds, pullStatuses, pullManagersPerm, pullRoutes,
    finishedOdometerData, statusesIds, routesIds, tripsByDate, getStats, getAllAvailableTrips, availableTrips, pushManagerPermData, netLogin, touch,
    isThisWhPoint, inplaceLoading
  }
})

