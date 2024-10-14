<template>
    <v-sheet v-if="trip.id" elevation="0" max-width="600" rounded="lg" width="100%" class="pa-0 mx-auto">
        <v-card flat>
            <v-card-title class="d-flex justify-space-between pa-0 pb-1">
                <div>Рейс № {{ trip.id }}</div>
                <StatusChip :tripId="trip.id" />
            </v-card-title>
            <v-card-text class="text-grey text-caption pa-0">
                Дата рейсу: {{ appStore.formatDate(trip.doc.date) }}
            </v-card-text>
            <v-card-text class="pa-0 d-flex justify-space-between align-end">
                <div>
                    <div>На маршруті: {{ trip.doc.points && trip.doc.points.length }} точок</div>
                    <div>Загальний кілометраж: {{ tripLength(trip.doc._id) }} км</div>
                    <div v-if="tripSatatus == 300">Кілометраж факт: {{ tripLengthFact }}</div>
                </div>
                <div class="text-right">
                    <v-btn :disabled="checkMapBtn() ? false : true" @click="openGoogleMap()" title="На карті"
                        variant="text" icon="mdi-map-search-outline"></v-btn>
                    <div v-if="trip.doc.isCircular" class="text-caption text-grey">кільцевий</div>
                </div>
            </v-card-text>

        </v-card>
    </v-sheet>
</template>

<script setup>
import { defineProps, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import StatusChip from './TripStatusChip.vue'

const appStore = useAppStore()
const router = useRouter()
const props = defineProps({
    trip: Object
})
const statuses = ref({})
const tripLengthFact = ref(0)
const tripSatatus = ref(0)

const tripLength = (id) => {
    let length = 0
    if (props.trip && props.trip.doc && props.trip.doc.points) {
        length = props.trip.doc.points.reduce((acc, item) => {
            return acc + item.distance
        }, 0)
    }
    length = Math.round(length * 100) / 100
    return length
}

const getTripLengthFact = async () => {
    statuses.value = await appStore.getTripStatusesDoc(props.trip.id)
    if(statuses.value && statuses.value.odometerStart && statuses.value.odometerFinish) {
        tripSatatus.value = statuses.value.status
        return statuses.value.odometerStart + '/' + statuses.value.odometerFinish + ' ' + (statuses.value.odometerFinish - statuses.value.odometerStart) + ' км'
    } 
}
const checkMapBtn = () => {
    //якщо хоч одна точка не містить координати, то кнопка посилання має бути неактивним
    let result = true
    if (props.trip && props.trip.doc && props.trip.doc.points) {
        result = props.trip.doc.points.every(item => item.coordinates && item.coordinates.latitude && item.coordinates.longitude)
    }
    return result
}
const mapUrl = computed(() => {
    let url = 'https://www.google.com/maps/'
    if (props.trip && props.trip.doc && props.trip.doc.points) {
        let points = props.trip.doc.points
        let start = points[0]
        let end = points[points.length - 1]
        let visitPoints = points.slice(1, points.length - 1)
        let visitPointsStr = visitPoints.map(item => item.coordinates.latitude + ',' + item.coordinates.longitude).join('|')
        url = 'https://www.google.com/maps/dir/?api=1&origin=' + start.coordinates.latitude + ',' + start.coordinates.longitude + '&destination=' + end.coordinates.latitude + ',' + end.coordinates.longitude + '&waypoints=' + visitPointsStr + '&optimizeWaypoints=true'
    }
    return url
})
const openGoogleMap = () => {
    window.open(mapUrl.value, '_blank')
}
onMounted(async () => {
    tripLengthFact.value = await getTripLengthFact()
})

</script>

<style>
.v-sheet,
.v-card {
    background-color: white
}
</style>