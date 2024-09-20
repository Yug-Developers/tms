<template>
    <v-chip :color="colors[status]" size="small" variant="outlined">
        {{ appStore.pointStatusObj[status] }}
    </v-chip>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { defineProps, computed } from 'vue'

const appStore = useAppStore()

const props = defineProps({
    tripId: String,
    pointId: Number,
})


const colors = {
    100: 'orange',
    200: 'green',
    300: 'red',
}

const status = computed(() => {
    const trip = appStore.statuses.find((item) => item._id == props.tripId)
    const point = trip && trip.points && trip.points.find((item) => item.id == props.pointId)
    return point && point.status || 100
})
</script>