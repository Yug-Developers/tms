<template>
    <div>
        <v-select v-model="selectedCamera" :items="cameraOptions" label="Виберіть камеру"
            :loading="cameraOptions.length === 0" @update:modelValue="handleCameraChange"></v-select>
        <div id="scanner-reader" style="margin-top: 20px;"></div>
        <div v-if="qrResult">Результат: {{ qrResult }}</div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

const qrResult = ref('')
const cameraOptions = ref([])
const selectedCamera = ref(null)
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
        },
        (error) => {
            //   console.warn('QR Error:', error)
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
        const cameras = await Html5Qrcode.getCameras()
        cameraOptions.value = cameras.map((camera) => ({
            title: camera.label || `Камера ${camera.id}`,
            value: camera.id,
        }))
        if (cameraOptions.value.length > 0) {
            selectedCamera.value = cameraOptions.value[1]?.value || cameraOptions.value[0]?.value
        }
    } catch (error) {
        console.error('Помилка завантаження камер:', error)
    }
}

const handleCameraChange = async () => {
    alert('handleCameraChange')
    if (html5QrCode) {
        await stopQrScanner()
    }
    await startQrScanner()
}

onMounted(async () => {
    await loadCameras()
    await startQrScanner()
})

onUnmounted(() => {
    stopQrScanner()
})
</script>

