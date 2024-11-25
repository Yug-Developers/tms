<template>
    <v-sheet v-if="trip.id" style="cursor:pointer" @click="goToTrip(trip.id)" elevation="12" max-width="600" rounded="lg" width="100%"
        class="pa-4 mx-auto my-4">
        <v-card flat class="text-left">
            <v-card-title class="d-flex justify-space-between">
                <div>№ {{ trip.id }} <!-- v-icon v-if="trip.doc.isCircular" size="small" icon="mdi-rotate-360" color="green" class="ml-4 mb-1" title="Кільцевий маршрут"/ --></div>
                <StatusChip :tripId="trip.id"/>
            </v-card-title>
            <v-card-text class="text-grey text-caption">
                Дата рейсу: {{ appStore.formatDate(trip.doc.date) }}
            </v-card-text>
            <v-card-text class="py-0 d-flex justify-space-between align-end">
                <div>
                    <div><b>На маршруті:</b> {{ pointsNumber }} точок</div>
                    <div><b>Кілометраж:</b> {{ tripLength(trip.doc._id) }} км</div>
                    <!-- <div v-if="tripSatatus == 300"><b>Кілометраж факт:</b> {{ tripLengthFact }} км</div> -->
                </div>
                <div class="text-right">
                    <div v-if="trip.doc.isCircular || trip.doc.circular" class="text-caption text-grey">кільцевий</div>
                </div>

            </v-card-text>
        </v-card>
    </v-sheet>
</template>

<script setup>
import { defineProps, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import StatusChip from './TripStatusChip.vue'

const statuses = ref({})
const tripSatatus = ref(0)
const router = useRouter()
const props = defineProps({
    trip: Object
})
const tripLengthFact = ref(0)
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

const getTripLengthFact = async () => {
    statuses.value = await appStore.getTripStatusesDoc(props.trip.id)
    if(statuses.value && statuses.value.odometerStart && statuses.value.odometerFinish) {
        tripSatatus.value = statuses.value.status
        return statuses.value.odometerFinish - statuses.value.odometerStart
    } 
}

const pointsNumber = computed(() => {
    if (props.trip && props.trip.doc && props.trip.doc.points){
        return props.trip.doc.isCircular || props.trip.doc.circular ? (props.trip.doc.points.length + 1) : props.trip.doc.points.length
    } else {
        return 0
    }
})

const goToTrip = (id) => {
    router.push(`/trip/${id}`)
}
onMounted(async () => {
    tripLengthFact.value = await getTripLengthFact()
})


</script>