<template>
    <v-sheet v-if="trip.id" elevation="0" max-width="600" rounded="lg" width="100%"
        class="pa-0 mx-auto">
        <v-card flat>
            <v-card-title class="d-flex justify-space-between pa-0">
                <div>Рейс № {{ trip.id }} <v-icon v-if="trip.doc.isCircular" size="small" icon="mdi-rotate-360" color="green" class="ml-4 mb-1" title="Кільцевий маршрут"/></div>
                <StatusChip :tripId="trip.id"/>
            </v-card-title>
            <v-card-text class="text-grey text-caption pa-0">
                Дата рейсу: {{ appStore.formatDate(trip.doc.date) }}
            </v-card-text>
            <v-card-text class="pa-0 d-flex justify-space-between align-end">
                <div>
                    <div>На маршруті: {{ trip.doc.points && trip.doc.points.length }} точок</div>
                    <div>Загальний кілометраж: {{ tripLength(trip.doc._id) }} км</div>
                </div>
                <v-btn :disabled="checkMapBtn() ? false : true" icon @click="openGoogleMap()" class="mb-2" title="На карті"><v-icon>mdi-map-search-outline</v-icon></v-btn>
            </v-card-text>

        </v-card>
    </v-sheet>
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import StatusChip from './TripStatusChip.vue'

const appStore = useAppStore()
const router = useRouter()
const props = defineProps({
    trip: Object
})

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

</script>