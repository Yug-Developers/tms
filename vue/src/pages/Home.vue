<template>
    <MainNavigation />
    <v-layout full-height class="align-center">
        <v-container>
            <v-row>
                <v-col cols="12" sm="6"> 
                    <v-sheet elevation="12" max-width="500" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="success" icon="mdi-check-circle" size="80"></v-icon>
                        <h2 class="text-h6 mb-6">Усього<br>рейсів</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            {{ trips.length }}
                        </p>
                    </v-sheet>
                </v-col>
                <v-col cols="12" sm="6">
                    <v-sheet elevation="12" max-width="500" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="blue" icon="mdi-counter" size="80"></v-icon>
                        <h2 class="text-h6 mb-6">Усього<br>кілометрів</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            {{ odometrTotal }}
                        </p>
                    </v-sheet>
                </v-col>
            </v-row>
            <h2 class="my-10 text-center">Рейси в роботі:</h2>
            <v-row v-for="trip in currentTrips">
                <v-col>
                    <TripBlk :trip="trip" />
                    <div v-if="!currentTrips.length" class="text-center text-grey">Рейсів в роботі немає.</div>
                </v-col>
            </v-row>
        </v-container>
    </v-layout>
</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
import TripBlk from '@/components/TripBlk.vue'
import { useAppStore } from '../store/appStore'
import { onMounted, ref, computed } from 'vue'
const appStore = useAppStore()
const trips = ref([])
const finishedStatuses = ref([])
const curTrips = ref([])


onMounted(async () => {
    try {
        await appStore.pullTripsData()
        const selector = { ... await appStore.getUserSelector() }
        // Доступні рейси
        const options = {
            selector,
            fields: ['_id']
        }
        trips.value = await appStore.availableTrips(options)
        // Кілометрів усього
        const optionsF = {
            selector: {
                odometerStart: { $exists: true },
                odometerFinish: { $exists: true },
                odometerFinish: { $gt: 0 },
                status: { $eq: 300 }
            },
            fields: ['_id', 'odometerStart', 'odometerFinish']
        }
        finishedStatuses.value = await appStore.availableStatuses(optionsF)
        // Поточні рейси
        curTrips.value = await appStore.currentTrips()
    }
    catch (error) {
        console.error(error)
    }
})

const odometrTotal = computed(() => {
    return finishedStatuses.value.reduce((acc, el) => {
        return acc + (Number(el.odometerFinish) - Number(el.odometerStart))
    }, 0)
})

const currentTrips = computed(() => {
    return curTrips.value && curTrips.value.map(el => { return { doc: el, id: el._id, key: el._id } }) || []
})


</script>