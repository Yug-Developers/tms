<template>
    <v-sheet v-if="trip.id" color="headerBlk" elevation="12" max-width="600" rounded="lg" width="100%"
        class="pa-4 text-center mx-auto">
        <v-card flat color="headerBlk">
            <v-card-title>
                Маршрут {{ trip.id }} ({{ trip.doc.date }})
            </v-card-title>
            <v-card-text class="pa-4 text-left mx-auto">
                <div>Точек маршруту: {{ trip.doc.points && trip.doc.points.length }}</div>
                <div>Кілометраж: {{ tripLength(trip.doc._id) }}</div>
                <div>Кільцевий маршрут: {{ trip.doc.circleType ? 'Так' : 'Ні' }}</div>
                <div>Статус: <StatusChip :tripId="trip.id" /></div>
            </v-card-text>
            <v-cart-actions>
                <v-btn icon @click="openGoogleMap()"><v-icon>mdi-map</v-icon></v-btn>
            </v-cart-actions>
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
    return length
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