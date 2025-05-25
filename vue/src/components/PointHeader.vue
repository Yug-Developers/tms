<template>
    <v-sheet v-if="point.id" elevation="0" max-width="600" rounded="sm" width="100%"
        class="pa-0 mx-auto mb-4 bg-transparent">

        <div class="text-grey text-caption">
            Рейс № {{ tripId }}
        </div>
        <div class="text-h6 d-flex justify-space-between pb-2">
            <div># {{ point.sortNumber }}</div>
            <span v-if="point.pointType == 'wh'" class="mt-1 text-caption font-weight-bold">СКЛАД</span>
            <StatusChip :tripId="tripId" :pointId="pointId" />
        </div>

        <v-card flat color="headerBlk" elevation="2">
            <v-card-text class="pa-4 text-left mx-auto">
                <div class="d-flex justify-space-between align-end">
                    <div>
                        <div v-if="point.pointType != 'wh'"><b>Контрагент:</b> {{ point.counterpartyName }}</div>
                        <div><b>Адреса:</b> {{ point.city }}, {{ point.address }} <span v-if="point.description">({{
                            point.description }})</span></div>
                        <div v-if="point.rcpt"><b>Отримувач:</b> {{ point.rcpt }},
                            <div class="d-flex flex-wrap">
                                <span class="d-flex flex-nowrap pr-2"
                                    v-for="phone in appStore.parsePhones(point.rcptPhone)">
                                    <v-icon size="x-small" icon="mdi-phone" class="mr-1 mt-1" color="green" />
                                    <a :href="'tel:' + phone" @click.stop>{{
                                        phone }}</a>
                                </span>
                            </div>
                        </div>
                        <!-- <div><b>Час на точці: </b> {{ pointTime }}</div> -->
                    </div>
                    <v-btn :disabled="coordinates ? false : true" @click.stop="openGoogleMap(coordinates)"
                        title="На карті" variant="text" icon="mdi-google-maps"></v-btn>
                </div>
                <div class="mt-2"><v-icon size="small" color="grey"
                        class="mr-2">mdi-package-variant-closed</v-icon>Місць: {{ allBoxesPallets }}</div>
                <div><v-icon size="small" color="grey" class="mr-2">mdi-email-outline</v-icon>COD: {{ allSum }}</div>
                <div v-if="point.sortNumber != '1'" class="text-right"><v-icon icon="mdi-map-marker-distance" /> <span
                        v-if="distance">{{ distance }}</span><span v-else>-</span> км</div>
                <div v-if="pointStatus != 100 && point.pointType != 'wh'">
                    <div><b>Факт виконання:</b></div>
                    <div><v-icon size="small" color="green" class="mr-2">mdi-package-variant-closed</v-icon>Місць: {{
                        allBoxesPalletsFact }} </div>
                    <div><v-icon size="small" color="green" class="mr-2">mdi-email-outline</v-icon>COD: {{ allSumFact }}
                        <span v-if="sumPack">(Пакети: {{ sumPack }})</span>
                    </div>
                </div>
                <div class="text-caption d-flex justify-space-between align-end mt-3">
                    <div><v-icon x-small class="green mr-2 mb-1">mdi-timer-check-outline</v-icon>{{ pointTime }}</div>
                    <v-btn icon="mdi-file-download-outline" color="green" variant="text" @click="downloadPDF()" :loading="appStore.pdfLoading"
                        title="Завантажити PDF звіт про точку"
                        v-if="!appStore.offline && appStore.localStg.userData.role == 'manager' && pointStatus == 300">
                    </v-btn>

                </div>
            </v-card-text>
        </v-card>
    </v-sheet>

    <v-sheet v-if="editorId" elevation="0" max-width="600" class="pa-0 mx-auto mb-4 bg-transparent">
        <v-divider class="mb-2"></v-divider>
        <div>
            <div v-if="disableInPlaceBtn && existsTripStatus == null" class="text-center text-primary my-2 mt-4">
                <v-icon icon="mdi-alert-circle-outline" color="primary" class="mr-2 mb-1"></v-icon>Рейс не розпочато
            </div>
            <div v-if="disableInPlaceBtn && existsTripStatus && pointStatus == 100"
                class="text-center text-primary my-2 mt-4">
                <v-icon icon="mdi-alert-circle-outline" color="primary" class="mr-2 mb-1"></v-icon>На Рейсі інша Точка
                знаходиться в роботі. Завершіть роботу з нею.
            </div>
            <div v-if="isThisFirstWhPoint && pointStatus == 100" class="text-center text-primary my-2 mt-4">
                <v-icon icon="mdi-alert-circle-outline" color="primary" class="mr-2 mb-1"></v-icon>Увага! Розпочинайте
                рейс лише після повного завантаження автомобіля на складі.
            </div>


        </div>
        <div class="d-flex justify-space-around">
            <v-btn :disabled="disableInPlaceBtn" v-if="pointStatus == 100" variant="elevated" color="blue"
                @click="inPlace()" :loading="appStore.inplaceLoading">{{ isThisFirstWhPoint || firstPoint ? `Старт` :
                    `На місці` }}</v-btn>
            <v-btn v-if="pointStatus == 200" variant="elevated" color="error"
                @click="cancelDialog = true">Скасувати</v-btn>
            <v-btn :disabled="uncomletedDocs" v-if="pointStatus == 200" @click="completePoint()" variant="elevated"
                color="success">Виконано</v-btn>
            <div v-if="pointStatus == 300" class="text-center">
                <v-icon icon="mdi-check-circle" color="green" class="mr-2 mb-1"></v-icon>Точка виконана
            </div>
        </div>
        <v-divider class="mt-2"></v-divider>
    </v-sheet>

    <v-dialog v-model="odometerDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Показання одометра
            </v-card-title>
            <v-card-text>
                <v-form v-model="isFormValid">
                    <v-text-field v-model="odometer" prepend-inner-icon="mdi-counter" :rules="[rules.number]" label="Км"
                        outlined></v-text-field>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="odometerDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="isFormValid ? false : true" @click="odometerSet()">Зберегти</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog v-model="odometrFinishDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Показання одометра
            </v-card-title>
            <v-card-text>
                <v-form v-model="isFormValid">
                    <v-text-field v-model="odometer" prepend-inner-icon="mdi-counter" :rules="[rules.number]" label="Км"
                        outlined></v-text-field>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="odometrFinishDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="isFormValid ? false : true" @click="completeTrip()">Зберегти</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog scrim="grey" v-model="cancelDialog" max-width="600">
        <v-card>
            <v-card-text>
                Ви впевнені, що хочете скасувати прибуття на точку?
            </v-card-text>
            <v-card-actions>
                <v-btn @click="cancelDialog = false">Ні</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="cancelPoint()">ТАК</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog scrim="error" v-model="completeTripDialogError" max-width="600">
        <v-card>
            <v-card-title>
                <v-icon color="primary" class="mr-2 mb-1">mdi-access-point-network-off</v-icon>Увага!
            </v-card-title>
            <v-card-text>
                <b>Рейс завершено</b>,<br>але дані не передані на сервер.
            </v-card-text>
            <v-card-text v-if="!appStore.offline">
                Якщо проблема повторюється, зверніться до логіста.<br>
            </v-card-text>
            <v-card-text v-if="appStore.offline">
                <b>Ви працюєте в off-line режимі.</b> Для передачі даних підключіться до мережі Інтернет.<br>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="completeTripDialogError = false">Закрити</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" :disabled="appStore.offline" @click="repostStatuses()">Передати</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- <pre>{{ point }}</pre> -->
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatusChip from './PointStatusChip.vue'
import { useAppStore } from '@/store/appStore'

const appStore = useAppStore()
const router = useRouter()
const props = defineProps({
    tripId: String,
    point: Object,
    points: Array,
    editorId: Boolean
})
const odometer = ref('')
const odometerDialog = ref(false)
const cancelDialog = ref(false)
const odometrFinishDialog = ref(false)
const isFormValid = ref(false)
const isThisFirstWhPoint = ref(false)
const completeTripDialogError = ref(false)

const emit = defineEmits(['init-data'])


const rules = {
    number: v => v && !isNaN(v) && !/\s+/.test(v) || 'Тільки цифри'
}

const downloadPDF = async () => {
    try {
        const res = await appStore.downloadPointReportPDF(props.tripId, props.point.id)
        if (res) {
            const binary = atob(res) // Base64 -> binary string
            const len = binary.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
                bytes[i] = binary.charCodeAt(i)
            }
            const blob = new Blob([bytes], { type: 'application/pdf' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `report_${props.tripId}_${props.point.id}.pdf`
            a.click()
            window.URL.revokeObjectURL(url)
        } else {
            appStore.setSnackbar({ text: "Помилка завантаження PDF", type: 'error' })
        }
    } catch (error) {
        console.error(error)
        appStore.setSnackbar({ text: "Помилка завантаження PDF", type: 'error' })
    }
}

const inPlace = async () => {
    appStore.inplaceLoading = true
    if (await appStore.checkEmptyPointDocsExists(props.tripId)) {
        appStore.setSnackbar({ text: "Рейс має документи з 0 місць. Для запуску рейса необхідно виправити документи - зверніться до логіста!", type: 'error' })
        appStore.inplaceLoading = false
        return
    }

    emit('init-data', {})
    const activTrips = await appStore.checkOpenTrip(props.tripId)
    if (activTrips) {
        appStore.setSnackbar({ text: "Неможливо відкрити новий рейс. Є інші активні рейси.", type: 'error' })
        appStore.inplaceLoading = false
        return
    }
    if (props.point?.sortNumber == 1 && !existsTripStatus.value) {
        odometerDialog.value = true
        odometer.value = ''
    } else {
        try {
            await appStore.inPlace(props.tripId, props.point?.id)
            appStore.setSnackbar({ text: "Збережено координати та час", type: 'success' })
        } catch (error) {
            appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
            console.error(error)
        }
    }
    appStore.inplaceLoading = false
}

const completePoint = async () => {
    try {
        if (!uncompetedPoints.value) {
            odometrFinishDialog.value = true
            odometer.value = ''
        } else {
            await appStore.completePoint(props.tripId, props.point.id)
            appStore.setSnackbar({ text: "Точка завершена", type: 'success' })
        }
    } catch (error) {
        appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
        console.error(error)
    }
}

const odometerSet = async () => {
    try {
        await appStore.initNewTripStatus(props.tripId, { odometerStart: odometer.value })
        odometerDialog.value = false
        if (isThisFirstWhPoint.value) {
            await appStore.completePoint(props.tripId, props.point.id)
            appStore.setSnackbar({ text: "Точка завершена", type: 'success' })
        } else {
            appStore.setSnackbar({ text: "Збережено координати та час", type: 'success' })
        }
    } catch (error) {
        appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
        console.error(error)
    }
}

const completeTrip = async () => {
    try {
        await appStore.completePoint(props.tripId, props.point.id)
        appStore.setSnackbar({ text: "Точка завершена", type: 'success' })
        try {
            await appStore.completeTrip(props.tripId, { odometerFinish: odometer.value })
            appStore.setSnackbar({ text: "Рейс виконано", type: 'success' })
            odometrFinishDialog.value = false
        } catch (error) {
            appStore.setSnackbar({ text: "Помилка завершення рейсу", type: 'error' })
            console.error(error)
        }
        try {
            const res = await appStore.pushStatusesData(true)
            if (res) {
                router.push('/')
            } else {
                completeTripDialogError.value = true
            }
        } catch (error) {
            appStore.setSnackbar({ text: "Помилка передачі даних", type: 'error' })
            console.error(error)
        }
    } catch (error) {
        appStore.setSnackbar({ text: "Помилка завершення точки", type: 'error' })
        console.error(error)
    }
}

const repostStatuses = async () => {
    completeTripDialogError.value = false
    try {
        appStore.syncLoading = true
        const statusRes = await appStore.pushStatusesData(true)
        const docsCnt = statusRes?.content?.length || 0
        appStore.setSnackbar({ text: `Обмін даними проведено успішно. Передано документів: ${docsCnt}`, type: 'success' })
    } catch (error) {
        console.error('Error pushing data:', error)
        appStore.setSnackbar({ text: "Під час обміну виникла помилка " + error.message, type: 'error' })
    } finally {
        appStore.syncLoading = false
    }
}

const openGoogleMap = (url) => {
    window.open(url, '_blank')
}

const pointId = computed(() => {
    return props.point.id
})

const firstPoint = computed(() => {
    return props.point.sortNumber == 1 && !existsTripStatus.value ? true : false
})

const pointStatus = computed(() => {
    const trip = appStore.statuses && appStore.statuses.find((item) => item._id == props.tripId)
    const point = trip && trip.points && trip.points.find((item) => item.id == pointId.value)
    return point && point.status || 100
})

const pointTime = computed(() => {
    const trip = appStore.statuses && appStore.statuses.find((item) => item._id == props.tripId)
    const pointStatus = trip?.points?.find((item) => item.id == pointId.value) || {}
    if (pointStatus.arrivalTime && pointStatus.departureTime) {
        //вирахувати різницю в часі
        const arrival = new Date(pointStatus.arrivalTime)
        const departure = new Date(pointStatus.departureTime)
        const diff = Math.abs(departure - arrival) / 1000
        const minutes = (Math.floor(diff / 60) % 60) || 1
        const hours = Math.floor(diff / 3600)
        if (hours) {
            return hours + ' год ' + minutes + ' хв'
        } else {
            return minutes + ' хв'
        }
    } else {
        return '-'
    }
})


const cancelPoint = async () => {
    try {
        if (await appStore.checkPointDocs(props.tripId, pointId.value)) {
            const result = await appStore.cancelPoint(props.tripId, pointId.value)
            appStore.setSnackbar({ text: "Очищено координати та час", type: 'success' })
            cancelDialog.value = false
        } else {
            appStore.setSnackbar({ text: "Точка містить виконані доставки. Скасування прибуття на точку неможливе.", type: 'error' })
        }
    } catch (error) {
        console.error(error)
    }
}

const existsTripStatus = computed(() => {
    return appStore.statuses && appStore.statuses.find((item) => item._id == props.tripId)
})

const uncomletedDocs = computed(() => {
    if (existsTripStatus.value) {
        const docsStatuses = existsTripStatus.value.points.find((item) => item.id == pointId.value).docs
        return docsStatuses.filter((item) => item.status <= 200).length ? true : false
    }
})

const uncompetedPoints = computed(() => {
    if (existsTripStatus.value) {
        return existsTripStatus.value.points.filter((item) => item.id !== pointId.value && item.status < 300).length
    }
})

const allBoxesPallets = computed(() => {
    // Кількість кор / пал = Сума по документах з docType = Видача та Завдання (boxes / palletes)
    let boxes = 0
    let palletes = 0
    if (props.point && props.point.docs) {
        props.point.docs.forEach((doc) => {
            if (doc.docType == 'out' || doc.docType == 'out_RP' || doc.docType == 'task') {
                if (doc.boxQty) boxes += Number(doc.boxQty)
                if (doc.pallQty) palletes += Number(doc.pallQty)
            }
        })
    }
    return `${boxes} / ${palletes}`
})

const allBoxesPalletsFact = computed(() => {
    // Кількість кор / пал = Сума з бази статусів по документах з docType = Видача та Завдання (boxes / palletes)
    let boxes = 0
    let palletes = 0
    if (existsTripStatus.value && existsTripStatus.value.points) {
        const point = existsTripStatus.value.points.find((item) => item.id == pointId.value)
        if (point && point.docs) {
            point.docs.forEach((doc) => {
                if (doc.palletsFact) palletes += Number(doc.palletsFact)
                if (doc.boxesFact) boxes += Number(doc.boxesFact)
            })
        }
    }
    return `${boxes} / ${palletes}`
})

const sumPack = computed(() => {
    // sumPack (вивести суму сумарну по всіх доках з баси статусів, номери унікальних пакетів через кому)
    const packs = []
    if (existsTripStatus.value && existsTripStatus.value.points) {
        const point = existsTripStatus.value.points.find((item) => item.id == pointId.value)
        if (point && point.docs) {
            point.docs.forEach((doc) => {
                if (doc.sumPack && !packs.find(item => item == doc.sumPack)) packs.push(doc.sumPack)
            })
        }
    }
    return packs.length ? '(' + packs.join(', ') + ')' : ''
})

const allSum = computed(() => {
    // Сума COD = Сума по документах з docType = Видача та Завдання (sum)
    let sum = 0
    if (props.point && props.point.docs) {
        props.point.docs.forEach((doc) => {
            if (doc.docType == 'out' || doc.docType == 'out_RP' || doc.docType == 'task') {
                sum += Number(doc.sum)
            }
        })
    }
    return sum
})

const allSumFact = computed(() => {
    // Сума факт = Сума з бази статусів по документах з docType = Видача та Завдання (sumFact)
    let sum = 0
    if (existsTripStatus.value && existsTripStatus.value.points) {
        const point = existsTripStatus.value.points.find((item) => item.id == pointId.value)
        if (point && point.docs) {
            point.docs.forEach((doc) => {
                if (doc.sumFact) sum += Number(doc.sumFact)
            })
        }
    }
    return sum
})


// Знайти статус у работі по всіх точках
const existsWorkPoint = computed(() => {
    if (existsTripStatus.value && existsTripStatus.value.points) {
        return existsTripStatus.value.points.find((item) => item.status == 200) ? true : false
    } else {
        return true
    }
})

// Статус завершено по всіх точках
const existsTripComplete = computed(() => {
    if (existsTripStatus.value && existsTripStatus.value.points) {
        return existsTripStatus.value.points.find((item) => item.status < 300 && item.id != -1) ? false : true
    } else {
        return false
    }
})

const disableInPlaceBtn = computed(() => {
    if (props.point.id == -1) {
        return existsTripComplete.value ? false : true
    } else {
        if (!existsTripStatus.value && props.point.sortNumber == 1) {
            return false
        }
        if (existsWorkPoint.value) {
            return props.point.sortNumber == 1 ? false : true
        } else {
            return false
        }
    }
})

const distance = computed(() => {
    let distance = 0
    if (props.points) {
        const index = props.points.findIndex((item) => item.id == props.point.id)
        if (index > 0) {
            distance = props.points[index - 1].distance
        }
    }
    return distance
})

const coordinates = computed(() => {
    if (!props.point.coordinates) {
        return
    }
    return 'https://www.google.com/maps?q=' + props.point.coordinates.latitude + ',' + props.point.coordinates.longitude
})

onMounted(async () => {
    isThisFirstWhPoint.value = await appStore.isThisWhPoint(props.tripId, props.point.id)
})

</script>

<style>
.v-sheet,
.v-card {
    background-color: white
}
</style>