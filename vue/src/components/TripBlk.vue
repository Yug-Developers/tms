<template>
    <v-sheet v-if="trip.id" style="cursor:pointer" @click="goToTrip(trip.id)" elevation="12" max-width="600"
        rounded="lg" width="100%" class="py-4 px-2 mx-auto my-4">
        <v-card flat class="text-left">
            <v-card-title class="d-flex justify-space-between">
                <div>№ {{ trip.id }}
                    <!-- v-icon v-if="trip.doc.isCircular" size="small" icon="mdi-rotate-360" color="green" class="ml-4 mb-1" title="Кільцевий маршрут"/ -->
                </div>
                <StatusChip :tripId="trip.id" />
            </v-card-title>
            <v-card-text class="text-grey text-caption">
                Дата рейсу: {{ appStore.formatDate(trip.date) }}<br>
                Водій: {{ trip.driverName }}<br>
                Відповідальний: {{ trip.editorName }}
            </v-card-text>
            <v-card-text class="text-grey text-caption pt-0">
                <v-row>
                    <v-col cols="6">
                        <v-icon x-small
                            class="mr-1 ml-n1">mdi-flag-outline</v-icon>Старт:<br>
                        <span v-if="statusData.startTime">{{ appStore.formatDateTime(statusData.startTime) }}</span>
                        <span v-else>-</span>
                    </v-col>
                    <v-col cols="6">
                        <v-icon x-small
                            class="mr-1 ml-n1">mdi-flag-checkered</v-icon>Фініш:<br>
                        <span v-if="statusData.finishTime">{{ appStore.formatDateTime(statusData.finishTime) }}</span>
                        <span v-else>-</span>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-text class="py-0 d-flex justify-space-between align-end">
                <div>
                    <div><b>На маршруті:</b> {{ pointsNumber }} точок</div>
                    <div><b>Кілометраж:</b> {{ tripLength(trip.id) }} км</div>
                </div>
                <div class="text-right">
                    <div v-if="trip.isCircular || trip.circular" class="text-caption text-grey">кільцевий</div>
                </div>
            </v-card-text>
        </v-card>
    </v-sheet>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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
    if (props.trip?.points) {
        length = props.trip.points.reduce((acc, item) => {
            return acc + item.distance
        }, 0)
    }
    // округлити до 2 знаків після коми
    length = Math.round(length * 100) / 100
    return length
}

const pointsNumber = computed(() => {
    if (props.trip?.points) {
        return props.trip.isCircular || props.trip.circular ? (props.trip.points.length + 1) : props.trip.points.length
    } else {
        return 0
    }
})

const statusData = computed(() => {
    const out = appStore.statuses.find(el => el._id === String(props.trip.id))
    return out || {}
})

const goToTrip = (id) => {
    router.push(`/trip/${id}`)
}
onMounted(async () => {
})


</script>