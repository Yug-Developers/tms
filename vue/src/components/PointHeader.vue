<template>
    <v-sheet color="headerBlk" v-if="point.id" elevation="12" max-width="600" rounded="lg" width="100%"
        class="pa-4 text-center mx-auto">
        <v-card flat color="headerBlk">

            <v-card-title>
                Точка {{ point.id }}
            </v-card-title>
            <v-card-text class="pa-4 text-left mx-auto">
                <div>Статус:
                    <StatusChip :tripId="tripId" :pointId="pointId" />
                </div>
                <div>Тип: {{ point.pointType }}</div>
                <div>Адреса: {{ point.name }}</div>
                <div>Отримувач: {{ point.rcpt }} ({{ point.rcptTel }})</div>
                <div>Відстань: {{ distance }}</div>
            </v-card-text>
            <v-card-actions v-if="editor">
                <v-btn v-if="pointStatus == 100" variant="elevated" color="blue" @click="inPlace()">На місці </v-btn>
                <v-btn v-if="pointStatus == 200" variant="elevated" color="error"
                    @click="cancelDialog = true">Скасувати</v-btn>
                <v-btn :disabled="uncomletedDocs" v-if="pointStatus == 200" @click="completePoint()" variant="elevated"
                    color="success">Виконано</v-btn>
            </v-card-actions>
        </v-card>
    </v-sheet>

    <v-dialog v-model="odometerDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Введіть показання одометра
            </v-card-title>
            <v-card-text>
                <v-form v-model="isFormValid">
                    <v-text-field v-model="odometer" prepend-inner-icon="mdi-counter" :rules="[rules.number]" label="Одометр" outlined></v-text-field>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn :disabled="isFormValid ? false : true" @click="odometerSet()">Зберегти</v-btn>
                <v-btn color="grey" @click="odometerDialog = false">Відмінити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog v-model="odometrFinishDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Введіть показання одометра
            </v-card-title>
            <v-card-text>
                <v-form v-model="isFormValid">
                    <v-text-field v-model="odometer" prepend-inner-icon="mdi-counter" :rules="[rules.number]" label="Одометр" outlined></v-text-field>                    
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-btn :disabled="isFormValid ? false : true" @click="completeTrip()">Зберегти</v-btn>
                <v-btn color="grey" @click="odometrFinishDialog = false">Відмінити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog scrim="error" v-model="cancelDialog" max-width="600">
        <v-card>
            <v-card-title>
                Ви впевнені, що хочете скасувати виконання точки?
            </v-card-title>
            <v-card-actions>
                <v-btn @click="cancelDialog = false">Відмінити</v-btn>
                <v-btn color="grey" @click="cancelPoint()">Скасувати</v-btn>
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
    editor: Boolean
})
const odometer = ref('')
const odometerDialog = ref(false)
const cancelDialog = ref(false)
const odometrFinishDialog = ref(false)
const isFormValid = ref(false)


const rules = {
    number: v => v && !isNaN(v) && !/\s+/.test(v) || 'Тільки цифри'
}

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

const inPlace = async () => {
    const activTrips = await appStore.checkOpenTrip(props.tripId)
    if (activTrips) {
        appStore.setSnackbar({ text: "Неможливо відкрити новий рейс. Є інші активні рейси.", type: 'error' })
        return
    }
    if (props.point.sort == 1 && !existsTripStatus.value) {
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

</script>