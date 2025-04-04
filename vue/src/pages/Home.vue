<template>
    <MainNavigation />
    <v-layout class="align-center">
        <v-container max-width="600">
            <v-row>
                <v-col cols="12">
                    <v-card elevation="0" class="bg-transparent">
                        <v-card-subtitle class="px-0">Вітаємо,</v-card-subtitle>
                        <v-card-title class="font-weight-bold text-body2 px-0">{{ appStore.localStg.userData &&
                            appStore.localStg.userData.pib }}!</v-card-title>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="6">
                    <v-sheet elevation="12" max-width="500" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="success" icon="mdi-check-circle"
                            :size="smAndDown ? 60 : 80"></v-icon>
                        <h2 class="text-body-1 text-md-h6 mb-6">Усього<br>рейсів</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            <span v-if="!statsLoading">
                                <span>{{ appStore.localStg.stats?.tripsCounter || '-' }}</span>
                            </span>
                            <span v-else><v-progress-circular indeterminate></v-progress-circular></span>
                        </p>
                    </v-sheet>
                </v-col>
                <v-col cols="6" sm="6">
                    <v-sheet elevation="12" max-width="500" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="blue" icon="mdi-counter" :size="smAndDown ? 60 : 80"></v-icon>
                        <h2 class="text-body-1 text-md-h6 mb-6">Усього<br>кілометрів</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            <span v-if="!statsLoading">
                                <span>{{ appStore.localStg.stats?.odometerTotal || '-' }}</span>
                            </span>
                            <span v-else><v-progress-circular indeterminate></v-progress-circular></span>
                        </p>
                    </v-sheet>
                </v-col>
            </v-row>
            <h2 class="my-10 text-center">Рейси в роботі:</h2>
            <div v-if="tripsLoading">
                <v-skeleton-loader max-width="600" type="article" class="mx-auto my-4"></v-skeleton-loader>
                <v-skeleton-loader max-width="600" type="article" class="mx-auto my-4"></v-skeleton-loader>
            </div>
            <div v-if="!tripsLoading && filteredTrips.length">
                <div v-for="trip in filteredTrips" :key="trip.id">
                    <TripBlk :trip="trip" />
                </div>
            </div>
            <div v-if="!tripsLoading && filteredTrips.length === 0" class="text-center text-grey">Рейсів в роботі
                немає.
            </div>
        </v-container>
    </v-layout>
</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
import TripBlk from '@/components/TripBlk.vue'
import { useAppStore } from '../store/appStore'
import { onMounted, ref, computed } from 'vue'
import { useDisplay } from 'vuetify'

const { smAndDown } = useDisplay()
const appStore = useAppStore()
const tripsLoading = ref(false)
const statsLoading = ref(false)

const filteredTrips = computed(() => {
    // якщо в базі статусів статус 300 то він не відображається в списку рейсів
    return appStore.activeTrips.filter(trip => appStore.closedStatusesIds.includes(trip._id) === false)
})

onMounted(async () => {
    try {
        tripsLoading.value = true
        statsLoading.value = true
        await appStore.getStats()
        statsLoading.value = false

        await appStore.pullTripsData()
        tripsLoading.value = false

    }
    catch (error) {
        console.error(error)
        tripsLoading.value = false
        statsLoading.value = false
    }
})
</script>