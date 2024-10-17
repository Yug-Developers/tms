<template>
    <v-sheet v-if="point.id" elevation="0" max-width="600" rounded="sm" width="100%" class="pa-0 mx-auto mb-4">
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
                        <div><b>Адреса:</b> {{ point.address }} <span v-if="point.description">({{ point.description }})</span></div>
                        <div v-if="point.pointType != 'wh'"><b>Отримувач:</b> {{ point.rcpt }}, <span
                                class="d-flex flex-nowrap"><v-icon size="x-small" icon="mdi-phone" class="mr-1 mt-1"
                                    color="green" />
                                <a :href="'tel:' + point.rcptPhone" @click.stop>{{ point.rcptPhone }}</a></span>
                        </div>
                    </div>
                        <v-btn :disabled="coordinates ? false : true" @click.stop="openGoogleMap(coordinates)" title="На карті"
                        variant="text" icon="mdi-google-maps"></v-btn>                        
                </div>
                <div class="mt-2"><v-icon size="small" color="grey" class="mr-2">mdi-package-variant-closed</v-icon>Місць: {{ allBoxesPallets }}</div>
                <div><v-icon size="small" color="grey" class="mr-2">mdi-email-outline</v-icon>COD: {{ allSum }}</div>
                <div v-if="point.sortNumber != '1'" class="text-right"><v-icon icon="mdi-map-marker-distance" /> <span
                        v-if="distance">{{ distance }}</span><span v-else>-</span> км</div>
                <div v-if="pointStatus != 100 && point.pointType != 'wh'">
                    <div><b>Факт виконання:</b></div>
                <div><v-icon size="small" color="green" class="mr-2">mdi-package-variant-closed</v-icon>Місць: {{ allBoxesPalletsFact }} </div>
                <div><v-icon size="small" color="green" class="mr-2">mdi-email-outline</v-icon>COD: {{ allSumFact }} <span v-if="sumPack">(Пакети: {{ sumPack }})</span></div>
                </div>
            </v-card-text>
        </v-card>
    </v-sheet>
    
    <v-sheet v-if="editorId" elevation="0" max-width="600" class="pa-0 mx-auto mb-4">
        <v-divider class="mb-2"></v-divider>
        <div class="d-flex justify-space-around">
        <v-btn :disabled="disableInPlaceBtn" v-if="pointStatus == 100" variant="elevated" color="blue" 
            @click="inPlace()">На місці </v-btn>
        <v-btn v-if="pointStatus == 200" variant="elevated" color="error"  @click="cancelDialog = true">Скасувати</v-btn>
        <v-btn :disabled="uncomletedDocs" v-if="pointStatus == 200" @click="completePoint()" variant="elevated"
            color="success">Виконано</v-btn>
        <div v-if="pointStatus == 300" class="text-center">
            <v-icon  icon="mdi-check-circle" color="green" class="mr-2 mb-1" />Точка виконана</div>
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
    <v-dialog scrim="error" v-model="cancelDialog" max-width="600">
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
        await appStore.completePoint(props.tripId, props.point.id)
        appStore.setSnackbar({ text: "Точка завершена", type: 'success' })
        await appStore.completeTrip(props.tripId, { odometerFinish: odometer.value })
        appStore.setSnackbar({ text: "Рейс виконано", type: 'success' })
        router.push('/')
    } catch (error) {
        appStore.setSnackbar({ text: "Помилка збереження", type: 'error' })
        console.error(error)
    }
}

const openGoogleMap = (url) => {
    window.open(url, '_blank')
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
        return existsTripStatus.value.points.filter((item) => item.id !== pointId.value && item.status < 300 ).length
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
                console.log(doc)
                if (doc.palletsFact) palletes += Number(doc.palletsFact)
                if (doc.boxesFact) boxes += Number(doc.boxesFact)
            })
        }
    }
    return `${boxes} / ${palletes}`
})

const sumPack = computed(() => {
    // sumPack (вивести суму сумарну по всіх доках з баси статусів, номери пакетів через кому)
    const packs = []
    if (existsTripStatus.value && existsTripStatus.value.points) {
        const point = existsTripStatus.value.points.find((item) => item.id == pointId.value)
        if (point && point.docs) {
            point.docs.forEach((doc) => {
                if (doc.sumPack) packs.push(doc.sumPack)
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
        return existsTripStatus.value.points.find((item) => item.status == 200 ) ? true : false
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
        if (!existsTripStatus.value && props.point.sortNumber == 1 ) {
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


</script>

<style>
.v-sheet, .v-card {background-color: white}
</style>