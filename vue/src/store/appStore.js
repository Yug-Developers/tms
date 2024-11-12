// This file contains the store for the app
import { defineStore } from 'pinia'
import { ref, reactive, computed, watch } from 'vue'
import { usePouchDB } from '@/hooks/PouchDb'
import useGeolocation from '@/hooks/geolocation'
import axios from 'axios'
import Config from '@/Config'
import md5 from 'md5'
import { useLocalStorage } from '@/hooks/useLocalStorage'
// ініціалізація локального сховища
const localStg = useLocalStorage({
  'userData': {},
  'user_name': '',
  'user_id': '',
})

const { location, locationError, getLocation } = useGeolocation();
const Pouch = usePouchDB()

export const useAppStore = defineStore('appStore', () => {
  // --------------------------------- state ----------------------------------
  const online = ref(navigator.onLine)
  const isSecureConnection = window.location.protocol === "https:"
  const loading = ref(false)
  const snackbar = reactive({
    timeout: 1500,
    text: '',
    model: false,
    color: 'accent-darken1',
    icon: 'done_outline',
  })
  const data = reactive({})
  const statuses = ref([])
  const navigationDrawerRightShow = ref(false)

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

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  const setCookie = (name, value, options = {}) => {
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (options.expires) {
      const expires = options.expires instanceof Date ? options.expires.toUTCString() : options.expires;
      cookieString += `; expires=${expires}`;
    }
    if (options.path) {
      cookieString += `; path=${options.path}`;
    }
    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }
    if (options.secure) {
      cookieString += `; secure`;
    }
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }
    document.cookie = cookieString;
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
      const res = await axios.post(Config.misUrl + '/tms/check-phone', { phone })
      return res.data

    } catch (error) {
      throw error
    }
  }

  const resetPassword = async (data) => {
    try {
      const res = await axios.post(Config.misUrl + '/tms/reset-password', data)
      return res.data
    } catch (error) {
      throw error
    }
  }

  const checkRecaptcha = async (token) => {
    try {
      const res = await axios.post(Config.misUrl + '/tms/check-recaptcha', { token })
      return res.data
    } catch (error) {
      throw error
    }
  }

  const getTmsTripsById = async (id) => {
    try {
      const res = await axios.post(Config.misUrl + '/tms/get-tms-trips-by-id', { id }, { withCredentials: true })
      return res.data
    } catch (error) {
      throw error
    }
  }

  const checkTmsTripsProcess = async () => {
    //check-tms-trips-process
    try {
      const res = await axios.post(Config.misUrl + '/tms/check-tms-trips-process', {}, { withCredentials: true })
      return res.data
    } catch (error) {
      throw error
    }
  }
  const sendSMScode = async ({ phone, message }) => {
    try {
      const res = await axios.post(Config.misUrl + '/tms/send-sms', {
        phone,
        message,
        alpha_name: Config.messengerMs.alphaName,
        tag: Config.messengerMs.tag
      },
        { withCredentials: true })
      return res.data
    } catch (error) {
      throw error
    }
  }
  // --------------------------------- actions --------------------------------
  const createCode = (phone) => {
    // const code = parseInt(Math.random() * 10000).toString().padStart(4, '0')
    // FIXME: remove this line
    const code = '1111'
    const hash = md5(code)
    return [code, hash]
  }

  //------------------------ login logout ----------------------------------
  const login = async (user, pass) => {
    try {
      Pouch.destroyDB('statuses')
      Pouch.destroyDB('routes')
      Pouch.destroyDB('users')
      localStg.userData = {}
      localStg.user_name = ''
      localStg.user_id = ''

      return await Pouch.login(user, pass)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      if (online.value) {
        await Pouch.logout()
      } else {
        setCookie('AuthSession', '', { expires: new Date(0), domain: '.yugcontract.ua' })
      }
      Pouch.destroyDB('statuses')
      Pouch.destroyDB('routes')
      Pouch.destroyDB('users')
      localStg.userData = {}
      localStg.user_name = ''
      localStg.user_id = ''
      return
    } catch (error) {
      throw error
    }

  }

  // ---------------------- реплікація -----------------------------------
  const pullTripsData = async () => {
    try {
      loading.value = true
      if (online.value) {
        const options = {
          filter: 'filter/by_status_editor',
          query_params: { editorId: localStg.user_id }
        }
        const pullRes = await Pouch.pull('routes', options)
        const currTrips = await currentTrips({ fields: ['_id'] })
        const opt = { doc_ids: [...currTrips.map(trip => trip._id)] }
        const pullSt = await Pouch.pull('statuses', opt)
      }
      statuses.value = await Pouch.fetchData('statuses')
      loading.value = false
    } catch (error) {
      throw error
    }
  }

  const pushStatusesData = async () => {
    try {
      if (online.value) {
        const pushRes = await Pouch.push('statuses')
      }
    } catch (error) {
      throw error
    }
  }

  const pullStatusesData = async (docIds) => {
    try {
      if (online.value) {
        const opt = { doc_ids: docIds }
        const pullSt = await Pouch.pull('statuses', opt)
      }
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
      return await Pouch.getRemoteDoc('routes', tripId)
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
      throw error
    }
  }
  // --------------------------- робота з віддаленими данними ------------------------
  const allRemoteDocs = async (dbName) => {
    try {
      return await Pouch.allRemoteDocs(dbName)
    } catch (error) {
      throw error
    }
  }

  const availableTrips = async (options) => {
    try {
      const dbName = 'routes'
      if (online.value) {
        return await Pouch.fetchRemoteData(dbName, options)
      } else {
        return await Pouch.fetchData(dbName, options)
      }
    } catch (error) {
      throw error
    }
  }

  const availableStatuses = async (options) => {
    try {
      const dbName = 'statuses'
      if (online.value) {
        return await Pouch.fetchRemoteData(dbName, options)
      } else {
        return await Pouch.fetchData(dbName, options)
      }
    } catch (error) {
      throw error
    }
  }

  const currentTrips = async (opt = {}) => {
    try {
      const dbName = 'routes'
      let selector = await getUserSelector()
      const options = {
        selector: {
          ...selector,
          status: 'active'
        }
        // use_index: ['driverId', 'addDriverId'] // Вказуємо використання попередньо створеного індексу
      }
      Object.assign(options, opt)
      if (online.value) {
        return await Pouch.fetchRemoteData(dbName, options)
      } else {
        return await Pouch.fetchData(dbName, options)
      }
    } catch (error) {
      throw error
    }
  }

  const getUserSelector = async () => {
    if (localStg.userData && !localStg.userData._id && online.value) {
      localStg.userData = await Pouch.getUserData(localStg.user_name)
    }



    const user_id = localStg.userData.typhoonId
    let selector = {}
    if (localStg.userData.role == 'manager') {
      const carriers = localStg.userData.carrierId ? localStg.userData.carrierId.map(el => Number(el)) : []
      selector = {
        carrierId: { $in: carriers }
      }
    } else {
      selector =
      {
        $or: [
          { driverId: { $eq: user_id } },
          { addDriverId: { $eq: user_id } },
          { driverId: { $eq: Number(user_id) } },
          { addDriverId: { $eq: Number(user_id) } }
        ]
      }
    }
    return selector
  }



  // --------------------------- статуси рейсів ------------------------------

  const initNewTripStatus = async (tripId, config) => {
    try {
      const points = []
      for (let point of config.points) {
        const cPoint = {}
        if (point.sortNumber == 1) {
          cPoint.id = point.id
          cPoint.status = 200
          cPoint.arrivalTime = new Date().toISOString()
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
            status: 200
          })
        }
        points.push(cPoint)
      }
      const data = {
        _id: tripId,
        status: 200,
        startTime: new Date().toISOString(),
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
          const cpoint = trip.points.find(point => point.id === pointId)
          if (cpoint.sortNumber == 1) {
            const res = await Pouch.deleteDoc('statuses', tripId)
            // const res = await Pouch.updateDoc('statuses', tripId, {_id: st._id, _rev: st._rev})
            statuses.value = await Pouch.fetchData('statuses')
            await pushStatusesData()
            return
          }
          point.status = 100
          point.arrivalTime = ''
          delete point.coordinates
          // for (let doc of point.docs) {
          //   doc.status = 100
          // }
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

  const inPlace = async (tripId, pointId, tripPoints) => {
    try {
      const st = await Pouch.getDoc('statuses', tripId)
      const currentPoint = tripPoints.find(point => point.id === pointId)
      const points = st.points
      for (let point of points) {
        if (point.id === pointId) {
          point.status = 200
          point.arrivalTime = new Date().toISOString()
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
          for (let doc of currentPoint.docs) {
            point.docs.push({
              id: doc.id,
              status: 200
            })
          }
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
              doc.statusConnection = online.value
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
              doc.statusConnection = online.value
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
              doc.statusConnection = online.value
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
          point.departureTime = new Date().toISOString()
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
      st.finishTime = new Date().toISOString()
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

  return {
    snackbar, setSnackbar, online, data, statuses, navigationDrawerRightShow, menuItems, loading,
    checkOpenTrip, pullTripsData, initNewTripStatus, cancelPoint, inPlace, checkPointDocs, releaseDoc, rejectDoc, cancelDoc,
    getTripDoc, getTripStatusesDoc, tripStatusObj, pointStatusObj, documentStatusObj, completePoint, completeTrip, sendSMScode,
    createCode, login, logout, allRemoteDocs, availableTrips, currentTrips, carriers, getUserSelector, checkPhone, resetPassword,
    availableStatuses, pushStatusesData, checkRecaptcha, formatDate, pullStatusesData, localStg, getTmsTripsById, checkTmsTripsProcess
  }
})

