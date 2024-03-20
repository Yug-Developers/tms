<template>
    <v-sheet v-if="trip.id" style="cursor:pointer" @click="goToTrip(trip.id)" elevation="12" max-width="600" rounded="lg" width="100%"
        class="pa-4 text-center mx-auto">
        <v-card flat>
            <v-card-title>
                Маршрут {{ trip.id }} ({{ trip.doc.date }})
            </v-card-title>
            <v-card-text class="pa-4 text-left mx-auto">
                <div>Точек маршруту: {{ trip.doc.points && trip.doc.points.length }}</div>
                <div>Кілометраж: {{ tripLength(trip.doc._id) }}</div>
                <div>Кільцевий маршрут: {{ trip.doc.circleType ? 'Так' : 'Ні' }}</div>
                <div>Статус: <StatusChip :tripId="trip.id"/> </div>
            </v-card-text>
        </v-card>
    </v-sheet>
</template>

<script setup>
import { defineProps, ref } from 'vue'
import { useRouter } from 'vue-router'
import StatusChip from './TripStatusChip.vue'
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

const goToTrip = (id) => {
    router.push(`/trip/${id}`)
}

</script>