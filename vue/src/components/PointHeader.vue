<template>
    <v-sheet v-if="point.id" elevation="0" max-width="600" rounded="sm" width="100%"
        class="pa-0 mx-auto">
        <div class="text-grey text-caption">
                Рейс № {{ tripId }}
        </div>
        <div class="text-h6 d-flex justify-space-between pb-2">
                <div># {{ point.sortNumber }}</div>
                <span v-if="point.pointType == 'wh'" class="mt-1 text-caption font-weight-bold">СКЛАД</span>
                <StatusChip :tripId="tripId" :pointId="pointId"/>
        </div>

        <v-card flat color="headerBlk" elevation="2">
            <v-card-text class="pa-2 text-left mx-auto">
                <div><b>Адреса:</b> {{ point.address }}</div>
                <div v-if="point.pointType != 'wh'"><b>Отримувач:</b> {{ point.rcpt }}, <span class="d-flex flex-nowrap"><v-icon size="x-small" icon="mdi-phone" class="mr-1 mt-1" color="green"/><a :href="'tel:' + point.rcptPhone">{{ point.rcptPhone }}</a></span></div>
                <div class="mt-2">Кіль-ть місць: {{ allBoxesPallets }}</div>
                <div>Сума COD: {{ allSum }}</div>
                <div v-if="point.sortNumber != '1'" class="text-right"><v-icon icon="mdi-map-marker-distance" /> <span v-if="distance">{{ distance }}</span><span v-else>-</span> км</div>
            </v-card-text>
        </v-card>
    </v-sheet>

    <v-divider class="mt-4 mb-2"></v-divider>
        <div v-if="editorId" class="d-flex justify-space-around">
                <v-btn :disabled="disableInPlaceBtn" v-if="pointStatus == 100" variant="elevated" color="blue" @click="inPlace()">На місці </v-btn>
                <v-btn v-if="pointStatus == 200" variant="elevated" color="error"
                    @click="cancelDialog = true">Скасувати</v-btn>
                <v-btn :disabled="uncomletedDocs" v-if="pointStatus == 200" @click="completePoint()" variant="elevated"
                    color="success">Виконано</v-btn>
                <div v-if="pointStatus == 300" class="text-center">Точка виконана.</div>
        </div>
    <v-divider class="mb-4 mt-2"></v-divider>

    <v-dialog v-model="odometerDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Показання одометра
            </v-card-title>
            <v-card-text>
                <v-form v-model="isFormValid">
                    <v-text-field v-model="odometer" prepend-inner-icon="mdi-counter" :rules="[rules.number]" label="Км" outlined></v-text-field>
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
                    <v-text-field v-model="odometer" prepend-inner-icon="mdi-counter" :rules="[rules.number]" label="Км" outlined></v-text-field>                    
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="odometrFinishDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="isFormValid ? false : true" @click="completeTrip()">Зберегти</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog scrim="error" v-model="cancelDialog" max-width="600">
        <v-card>
            <v-card-text>
                Ви впевнені, що хочете скасувати виконання точки?
            </v-card-text>
            <v-card-actions>
                <!-- <v-btn @click="cancelDialog = false">Скасувати</v-btn> -->
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="cancelPoint()">OK</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <!-- <pre>{{ point }}</pre> -->
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'
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


const rules = {
    number: v => v && !isNaN(v) && !/\s+/.test(v) || 'Тільки цифри'
}

const inPlace = async () => {
    const activTrips = await appStore.checkOpenTrip(props.tripId)
    if (activTrips) {
        appStore.setSnackbar({ text: "Неможливо відкрити новий рейс. Є інші активні рейси.", type: 'error' })
        return
    }
    if (props.point.sortNumber == 1 && !existsTripStatus.value) {
        odometerDialog.value = true
        odometer.value = ''
    } else {
        try {
            await appStore.inPlace(props.tripId, props.point.id, props.points)
            appStore.setSnackbar({ text: "Збережено координати та час", type: 'success' })
        } catch (error) {
            appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
            console.error(error)
        }
    }
}

const completePoint = async () => {
    try {
        await appStore.completePoint(props.tripId, props.point.id)
        appStore.setSnackbar({ text: "Точка завершена", type: 'success' })
        if (!uncompetedPoints.value) {
            odometrFinishDialog.value = true
            odometer.value = ''
        }
    } catch (error) {
        appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
        console.error(error)
    }
}

const odometerSet = async () => {
    try {
        await appStore.initNewTripStatus(props.tripId, { odometerStart: odometer.value, points: props.points })
        appStore.setSnackbar({ text: "Збережено координати та час", type: 'success' })
        odometerDialog.value = false
    } catch (error) {
        appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
        console.error(error)
    }
}

const completeTrip = async () => {
    try {
        await appStore.completeTrip(props.tripId, { odometerFinish: odometer.value })
        appStore.setSnackbar({ text: "Рейс виконано", type: 'success' })
        router.push('/')
    } catch (error) {
        appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
        console.error(error)
    }
}

const pointId = computed(() => {
    return props.point.id
})

const pointStatus = computed(() => {
    const trip = appStore.statuses && appStore.statuses.find((item) => item._id == props.tripId)
    const point = trip && trip.points && trip.points.find((item) => item.id == pointId.value)
    return point && point.status || 100
})

const cancelPoint = async () => {
    try {
        if (await appStore.checkPointDocs(props.tripId, pointId.value)) {
            const result = await appStore.cancelPoint(props.tripId, pointId.value)
            appStore.setSnackbar({ text: "Очищено координати та час", type: 'success' })
            cancelDialog.value = false
        } else {
            appStore.setSnackbar({ text: "Не можливо виконати скасування точки", type: 'error' })
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
        return docsStatuses.filter((item) => item.status <= 200).length
    }
})

const uncompetedPoints = computed(() => {
    console.log(existsTripStatus.value)
    if (existsTripStatus.value) {
        return existsTripStatus.value.points.filter((item) => item.status < 300).length
    }
})

const allBoxesPallets = computed(() => {
    // Кількість кор / пал = Сума по документах з docType = Видача та Завдання (boxes / palletes)
    let boxes = 0
    let palletes = 0
    if (props.point && props.point.docs ) {
            props.point.docs.forEach((doc) => {
                if (doc.docType == 'out' || doc.docType == 'task') {
                    if (doc.boxQty) boxes += doc.boxQty
                    if (doc.pallQty) palletes += doc.pallQty
                }
            })
    }
    return `${boxes} / ${palletes}`
})

const allSum = computed(() => {
    // Сума COD = Сума по документах з docType = Видача та Завдання (sum)
    let sum = 0
    if (props.point && props.point.docs ) {
            props.point.docs.forEach((doc) => {
                if (doc.docType == 'out' || doc.docType == 'task') {
                    sum += doc.sum
                }
            })
    }
    return sum
})

const previousePointStatus = computed(() => {
    if (existsTripStatus.value && existsTripStatus.value.points) {
        const index = existsTripStatus.value.points.findIndex((item) => item.id == props.point.id)
        if (index > 0) {
            return existsTripStatus.value.points[index-1].status
        }
    }
})

const disableInPlaceBtn = computed(() => {
    if (!previousePointStatus.value) {
        return props.point.sortNumber == 1 ? false : true
    } else {
        return previousePointStatus.value == 300  ? false : true
    }
})
</script>