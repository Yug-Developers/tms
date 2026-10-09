<template>
    <v-chip :color="colors[status]" variant="elevated">
        {{ appStore.tripStatusObj[status] }}
    </v-chip>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { computed } from 'vue'
const appStore = useAppStore()

const props = defineProps({
    tripId: String,
    executionStatus: { type: [Number, String], default: undefined }
})

const colors = {
    0: 'grey',
    100: 'yellow',
    200: 'green',
    300: 'red',
}

const status = computed(() => {
    if (props.executionStatus !== undefined) return props.executionStatus || 100
    const trip = appStore.statuses.find((item) => item._id == props.tripId)
    return trip && trip.status || 100
})
</script>
