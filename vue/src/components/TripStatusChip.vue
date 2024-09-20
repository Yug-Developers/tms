<template>
    <v-chip :color="colors[status]" variant="elevated">
        {{ appStore.tripStatusObj[status] }}
    </v-chip>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { defineProps, computed } from 'vue'
const appStore = useAppStore()

const props = defineProps({
    tripId: String
})

const colors = {
    0: 'grey',
    100: 'yellow',
    200: 'green',
    300: 'red',
}

const status = computed(() => {
    const trip = appStore.statuses.find((item) => item._id == props.tripId)
    return trip && trip.status || 100
})
</script>