<template>
    <div>
        <v-select
            v-model="selectedCamera"
            :items="cameraOptions"
            label="Виберіть камеру"
            :loading="loading"
            @update:modelValue="handleCameraChange"
        ></v-select>
        <v-alert v-if="cameraReadyError" type="error" dismissible>
            Помилка! {{ cameraReadyError }}
        </v-alert>
        <div id="scanner-reader" style="margin-top: 20px;"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { useAppStore } from '@/store/appStore'

const appStore = useAppStore()
const emit = defineEmits(['qrResult', 'barcodeResult']) // Оголошення події для емісії
const props = defineProps({
    barcode: Boolean
})
const qrResult = ref('')
const cameraOptions = ref([])
const selectedCamera = ref(null)
const cameraReadyError = ref(null)
const loading = ref(false)
let html5QrCode = null


const startQrScanner = async () => {
    if (!html5QrCode && document.getElementById('scanner-reader')) {
        html5QrCode = new Html5Qrcode('scanner-reader')
    }

    if (!selectedCamera.value) return

    await html5QrCode.start(
        selectedCamera.value,
        {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.7778,
        },
        (decodedText) => {
            qrResult.value = decodedText
            if (props.barcode) {
                emit('barcodeResult', decodedText) // Емісія події з результатом
            } else {
                emit('qrResult', decodedText) // Емісія події з результатом
            }
        },
        (error) => {
            // console.warn('QR Error:', error)
        }
    )
}

const stopQrScanner = async () => {
    if (html5QrCode) {
        await html5QrCode.stop()
        html5QrCode.clear()
        html5QrCode = null
    }
}

const loadCameras = async () => {
    try {
        loading.value = true
        const cameras = await Html5Qrcode.getCameras()
        cameraOptions.value = cameras.map((camera) => ({
            title: camera.label || `Камера ${camera.id}`,
            value: camera.id,
        }))
        if (cameraOptions.value.length > 0 && !selectedCamera.value) {
            // Вибір першої доступної камери, якщо не вибрано
            selectedCamera.value = cameraOptions.value[1]?.value || cameraOptions.value[0]?.value
        } else {
            selectedCamera.value = appStore.localStg.cameraId || cameraOptions.value[0]?.value
        }

        loading.value = false
    } catch (error) {
        loading.value = false
        cameraReadyError.value = error
        console.error('Помилка завантаження камер:', error)
    }
}

const handleCameraChange = async () => {
    appStore.localStg.cameraId = selectedCamera.value
    if (html5QrCode) {
        await stopQrScanner()
    }
    await startQrScanner()
}


onMounted(async () => {
    selectedCamera.value = appStore.localStg.cameraId
    await loadCameras()
    await startQrScanner()
})

onUnmounted(() => {
    stopQrScanner()
})
</script>
