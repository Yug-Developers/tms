import { useAppStore } from '@/store/appStore'
import { onMounted, onBeforeUnmount, computed } from 'vue'
import axios from 'axios'
import Config from '@/Config'

const pingServerInterval = 180000 // 3 хв
const pingServerTimeout = 5000 // 5 сек
const pingServerIntervalOffline = 10000 // 10 сек
let wasOffline = false
let pingOfflineInterval = null
let pingOnlineInterval = null
let isInitialized = false
let eventHandlersAdded = false

export function useOnlineStatus() {
    const appStore = useAppStore()

    const pingServer = async () => {
        if (!navigator.onLine) return false
        try {
            const response = await axios.post(Config.misUrl + '/tms/ping', {}, {
                timeout: pingServerTimeout,
                withCredentials: true
            })
            return response.status === 200 && response.data === 'pong'
        } catch (error) {
            return false
        }
    }

    const updateOnlineStatus = async () => {
        const isActuallyOnline = await pingServer()
        if (isActuallyOnline) {
            appStore.offline = false
        } else {
            appStore.offline = true
        }

        if (navigator.onLine) {
            if (appStore.offline) {
                console.log('Currently offline')
                if (!wasOffline) {
                    appStore.setSnackbar({ text: "Втрачено зв'язок з мережею", type: 'warning' })
                }
                wasOffline = true
                // Якщо втрачено зв'язок — частіша перевірка pingServerIntervalOffline
                if (pingOfflineInterval) clearInterval(pingOfflineInterval)
                pingOfflineInterval = setInterval(updateOnlineStatus, pingServerIntervalOffline)
            } else {
                if (wasOffline) {
                    console.log('Currently online')
                    appStore.setSnackbar({ text: "Зв'язок з мережею встановлено", type: 'success' })
                    if (appStore.skipSync) {
                        appStore.skipSync = false
                    } else {
                        await appStore.pullTripsData()
                        await appStore.pushStatusesData()
                        await appStore.pushManagerPermData()
                    }
                    wasOffline = false
                }
                // Якщо поновлено зв'язок — запускаємо інтервал pingServerInterval
                if (pingOnlineInterval) {
                    clearInterval(pingOnlineInterval)
                    pingOnlineInterval = null
                }
                if (pingOfflineInterval) {
                    clearInterval(pingOfflineInterval)
                    pingOfflineInterval = null
                }
                pingOnlineInterval = setInterval(updateOnlineStatus, pingServerInterval)
            }
        } else {
            console.log('Offline works')
            wasOffline = true
            appStore.offline = true
            appStore.setSnackbar({ text: "Застосунок працює без доступа до мережі", type: 'warning' })
        }
    }

    onMounted(() => {
        if (!isInitialized) {
            updateOnlineStatus()
            isInitialized = true
        }
        setTimeout(() => {
            if (!eventHandlersAdded) {
                window.addEventListener('online', updateOnlineStatus)
                window.addEventListener('offline', updateOnlineStatus)
                eventHandlersAdded = true
            }
        },
            100)
    })

    onBeforeUnmount(() => {
        if (eventHandlersAdded) {
            window.removeEventListener('online', updateOnlineStatus)
            window.removeEventListener('offline', updateOnlineStatus)
            eventHandlersAdded = true
        }
        if (pingOnlineInterval) {
            clearInterval(pingOnlineInterval)
            pingOnlineInterval = null
        }
        if (pingOfflineInterval) {
            clearInterval(pingOfflineInterval)
            pingOfflineInterval = null
        }
    })
    const offline = computed(() => appStore.offline)

    return { pingServer, updateOnlineStatus }
}
