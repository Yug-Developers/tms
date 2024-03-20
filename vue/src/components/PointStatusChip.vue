<template>
    <v-chip :color="colors[status]" class="mr-5" variant="flat">
        {{ appStore.pointStatusObj[status] }}
    </v-chip>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { defineProps, computed } from 'vue'

const appStore = useAppStore()

const props = defineProps({
    tripId: String,
    pointId: String,
})


const colors = {
    100: 'blue',
    200: 'green',
    300: 'blue',
}

const status = computed(() => {
    const trip = appStore.statuses.find((item) => item._id == props.tripId)
    const point = trip && trip.points && trip.points.find((item) => item.id == props.pointId)
    return point && point.status || 100
})
</script>