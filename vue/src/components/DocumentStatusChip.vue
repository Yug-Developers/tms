<template>
    <v-chip :color="colors[status]" size="small" variant="flat">
        {{ appStore.documentStatusObj[status] }}
    </v-chip>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { computed } from 'vue'
const appStore = useAppStore()

const props = defineProps({
    tripId: String,
    pointId: Number,
    docId: Number,
})
const status = computed(() => {
    const trip = appStore.statuses.find((item) => item._id == props.tripId)
    const point = trip && trip.points && trip.points.find((item) => item.id == props.pointId)
    const doc = point && point.docs && point.docs.find((item) => item.id == props.docId)
    return doc && doc.status || 100
})

const colors = {
    100: 'yellow',
    200: 'green',
    300: 'blue',
    400: 'error',
    500: 'primary',
}
</script>