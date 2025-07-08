<template>
    <div>
        <v-select v-model="selectedCamera" :items="cameraOptions" label="Виберіть камеру" :loading="loading"
            @update:modelValue="handleCameraChange"></v-select>
        <v-alert v-if="cameraReadyError" type="error" dismissible>
            Помилка! {{ cameraReadyError }}
        </v-alert>
        <div v-if="camerapermissions === 'denied'" class="py-5">
            <v-alert type="error" variant="outlined">Доступ до камери було заборонено.</v-alert>
            Це може статися, якщо ви відхилили дозвіл на доступ до камери під час першого запуску сканера QR-кодів або
            штрих-кодів.<br>
            Щоб увімкнути його знову, потрібно вручну змінити дозвіл у налаштуваннях системи або браузера.
        </div>
        <div class="py-5" v-if="camerapermissions === 'denied'" v-html="getCameraPermissionsInstructions()"></div>
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
const camerapermissions = ref(null)
let html5QrCode = null


const startQrScanner = async () => {
    if (!html5QrCode && document.getElementById('scanner-reader')) {
        html5QrCode = new Html5Qrcode('scanner-reader')
    }

    if (!selectedCamera.value) return
    html5QrCode.start(
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
            // alert('Помилка сканування QR-коду: ' + error.message)
        }
    )
    .catch((err) => {
        console.error('Помилка при запуску сканера QR-кодів:', err);
        cameraReadyError.value = 'Не вдалося запустити сканер QR-кодів: ' + err;
    });
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
        loading.value = true;

        const granted = await ensureCameraPermission();
        if (!granted) {
            cameraReadyError.value = 'Доступ до камери не надано.';
            loading.value = false;
            return;
        }

        const cameras = await Html5Qrcode.getCameras();
        cameraOptions.value = cameras.map((camera) => ({
            title: camera.label || `Камера ${camera.id}`,
            value: camera.id,
        }));

        if (cameraOptions.value.length > 0) {
            selectedCamera.value = appStore.localStg.cameraId || cameraOptions.value[0]?.value;
        }

        loading.value = false;
    } catch (error) {
        loading.value = false;
        cameraReadyError.value = error;
        console.error('Помилка завантаження камер:', error);
        alert('Помилка завантаження камер: ' + error);
    }
};

const ensureCameraPermission = async () => {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        return true;
    } catch (err) {
        console.error('Доступ до камери заборонено або не надано:', err);
        alert('Доступ до камери заборонено або не надано. Будь ласка, надайте дозвіл на доступ до камери.');
        return false;
    }
};

const handleCameraChange = async () => {
    try {
        appStore.localStg.cameraId = selectedCamera.value
        if (html5QrCode) {
            await stopQrScanner()
        }
        await startQrScanner()
    } catch (error) {
        console.error('Помилка при зміні камери:', error);
        cameraReadyError.value = 'Не вдалося змінити камеру: ' + error;
    }
}

const getBrowserName = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) return "Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
    if (ua.includes("MSIE") || ua.includes("Trident")) return "Internet Explorer";

    return "Unknown";
}

const getPlatform = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(ua)) return 'Android';
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'iOS';
    return 'Other';
}

const getCameraPermissionsInstructions = () => {
    const platform = getPlatform();
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

    if (isPwa) {
        if (platform === 'Android') {
            return 'Для надання доступу до камери в PWA на Android, перейдіть у налаштування програми → Дозволи → Камера → Дозволити.';
        } else if (platform === 'iOS') {
            return 'Для надання доступу до камери в PWA на iOS, перейдіть у налаштування програми → Дозволи → Камера → Дозволити.';
        } else {
            return 'Для надання доступу до камери в PWA, будь ласка, зверніться до документації вашого пристрою.';
        }
    } else {
        // звичайний браузер — показати стандартні інструкції з замком
        const browserName = getBrowserName();
        if (browserName === 'Chrome') {
            return `Щоб дозволити доступ до камери, натисніть на значок 🔒 в адресному рядку браузера → "Налаштування сайту" → "Камера" → виберіть "Дозволити".`;
        } else if (browserName === 'Firefox') {
            return `Щоб дозволити доступ до камери, натисніть на значок 🔒 в адресному рядку браузера → "Більше інформації" → "Дозволи" → "Камера".`
        } else if (browserName === 'Safari') {
            return `Щоб дозволити доступ до камери, перейдіть у "Налаштування" → "Safari" → "Камера" → "Дозволити".`;
        }
    }
}

onMounted(async () => {
    navigator.permissions.query({ name: 'camera' }).then(result => {
        camerapermissions.value = result.state;
    });
    selectedCamera.value = appStore.localStg.cameraId
    try {
        await loadCameras()
    } catch (error) {
        console.error('Помилка при завантаженні камер:', error);
        cameraReadyError.value = 'Не вдалося завантажити камери: ' + error;
    }
    setTimeout(async () => {
        try {
            await startQrScanner()
        } catch (error) {
            console.error('Помилка при ініціалізації QRScanner:', error);
            cameraReadyError.value = 'Не вдалося ініціалізувати сканер QR-кодів: ' + error;
        }

    }, 1000);

})

onUnmounted(() => {
    console.log('QRScanner unmounted')
    stopQrScanner()
})
</script>
