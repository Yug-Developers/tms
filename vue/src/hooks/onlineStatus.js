import { useAppStore } from '@/store/appStore'
import { onMounted, onBeforeUnmount } from 'vue'

export function useOnlineStatus() {
    const appStore = useAppStore()

    const updateOnlineStatus = () => {
        if (appStore.online !== navigator.onLine) {
            appStore.online = navigator.onLine
            if (appStore.online) {
                console.log('Currently online')
                appStore.setSnackbar({ text: "Зв'язок з мережею поновлено", type: 'success' })
            } else {
                console.log('Currently offline')
                appStore.setSnackbar({ text: "Втрачено зв'язок з мережею", type: 'warning' })
            }
        } else {
            if (!appStore.online) {
                console.log('Offline works')
                appStore.setSnackbar({ text: "Застосунок працює без доступа до мережі", type: 'warning' })
            }
        }
    }

    onMounted(() => {
        updateOnlineStatus();
        window.addEventListener('online', updateOnlineStatus)
        window.addEventListener('offline', updateOnlineStatus)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('online', updateOnlineStatus)
        window.removeEventListener('offline', updateOnlineStatus)
    })

    return {}
}
