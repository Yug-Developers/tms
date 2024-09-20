<template>
    <v-sheet v-if="trip.id" style="cursor:pointer" @click="goToTrip(trip.id)" elevation="12" max-width="600" rounded="lg" width="100%"
        class="pa-4 mx-auto">
        <v-card flat class="text-left">
            <v-card-title class="d-flex justify-space-between">
                <div>№ {{ trip.id }} <v-icon v-if="trip.doc.isCircular" size="small" icon="mdi-rotate-360" color="green" class="ml-4 mb-1" title="Кільцевий маршрут"/></div>
                <StatusChip :tripId="trip.id"/>
            </v-card-title>
            <v-card-text class="text-grey text-caption">
                Дата рейсу: {{ appStore.formatDate(trip.doc.date) }}
            </v-card-text>
            <v-card-text class="py-0 d-flex justify-space-between align-end">
                <div>
                    <div>На маршруті: {{ trip.doc.points && trip.doc.points.length }} точок</div>
                    <div>Загальний кілометраж: {{ tripLength(trip.doc._id) }} км</div>
                </div>
                <!-- <div v-if="trip.doc.isCircular">
                    <v-icon icon="mdi-rotate-360" color="green"/>
                </div> -->

            </v-card-text>
        </v-card>
    </v-sheet>
</template>

<script setup>
import { defineProps, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import StatusChip from './TripStatusChip.vue'
const router = useRouter()
const props = defineProps({
    trip: Object
})
const appStore = useAppStore()

const tripLength = (id) => {
    let length = 0
    if (props.trip && props.trip.doc && props.trip.doc.points) {
        length = props.trip.doc.points.reduce((acc, item) => {
                    return acc + item.distance
        }, 0)
    }
    // округлити до 2 знаків після коми
    length = Math.round(length * 100) / 100 
    return length
}

const goToTrip = (id) => {
    router.push(`/trip/${id}`)
}

</script>