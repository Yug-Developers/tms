<template>
    <div class="container-fluid">
        <MainNavigation />
        <v-container>
            <v-row>
                <v-col>
                    <v-sheet elevation="12" max-width="600" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="success" icon="mdi-check-circle" size="80"></v-icon>
                        <h2 class="text-h6 mb-6">Доступні<br>рейси</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            {{ trips.length }}
                        </p>
                    </v-sheet>

                </v-col>
                <v-col>
                    <v-sheet elevation="12" max-width="600" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="blue" icon="mdi-counter" size="80"></v-icon>
                        <h2 class="text-h6 mb-6">Кілометрів<br>усього</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            {{ odometrTotal }}
                        </p>
                    </v-sheet>
                </v-col>
            </v-row>
            <v-row v-for="trip in currentTrips">
                <v-col>
                    <TripBlk :trip="trip" />
                </v-col>
            </v-row>
        </v-container>
    </div>
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
    await appStore.pullTripsData()
    const selector = {... await appStore.getUserSelector()}
    // Доступні рейси
    const options = {
        selector,
        fields: ['_id']
    }
    trips.value = await appStore.availableTrips(options)
    // Кілометрів усього
    const optionsF = {
        selector: {
            odometerStart: {$exists: true},
            odometerFinish: {$exists: true},
            odometerFinish: { $gt: 0 },
            status: { $eq: 300 }
        },
        fields: ['_id', 'odometerStart', 'odometerFinish']
    }
    finishedStatuses.value = await appStore.availableStatuses(optionsF)
    // Поточні рейси
    curTrips.value = await appStore.currentTrips()
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