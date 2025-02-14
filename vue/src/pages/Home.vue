<template>
    <MainNavigation />
    <v-layout class="align-center">
        <v-container max-width="600">
            <v-row>
                <v-col cols="12">
                    <v-card elevation="0" class="bg-transparent">
                        <v-card-subtitle class="px-0">Вітаємо,</v-card-subtitle>
                        <v-card-title class="font-weight-bold text-body2 px-0">{{ appStore.localStg.userData && appStore.localStg.userData.pib }}!</v-card-title>
                    </v-card>
                </v-col>
                <v-col cols="6" sm="6"> 
                    <v-sheet elevation="12" max-width="500" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="success" icon="mdi-check-circle" :size="smAndDown ? 60 : 80"></v-icon>
                        <h2 class="text-body-1 text-md-h6 mb-6">Усього<br>рейсів</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            <span v-if="!tripsLoading">{{ trips.length }}</span>
                            <span v-else><v-progress-circular indeterminate></v-progress-circular></span>
                        </p>
                    </v-sheet>
                </v-col>
                <v-col cols="6" sm="6">
                    <v-sheet elevation="12" max-width="500" rounded="lg" width="100%" class="pa-4 text-center mx-auto">
                        <v-icon class="mb-5" color="blue" icon="mdi-counter" :size="smAndDown ? 60 : 80"></v-icon>
                        <h2 class="text-body-1 text-md-h6 mb-6">Усього<br>кілометрів</h2>
                        <p class="mb-4 text-medium-emphasis text-h4">
                            <span v-if="!finishedStatusesLoading">{{ odometrTotal }}</span>
                            <span v-else><v-progress-circular indeterminate></v-progress-circular></span>
                        </p>
                    </v-sheet>
                </v-col>
            </v-row>
            <h2 class="my-10 text-center">Рейси в роботі:</h2>
            <div v-if="tripsLoading" >
                <v-skeleton-loader max-width="600" type="article" class="mx-auto my-4"></v-skeleton-loader>
                <v-skeleton-loader max-width="600" type="article" class="mx-auto my-4"></v-skeleton-loader>
            </div>
            <div v-if="!tripsLoading && currentTrips.length" >
                <div v-for="trip in currentTrips" :key="trip.id">
                        <TripBlk :trip="trip" />
                </div>
            </div>
            <div v-if="!tripsLoading && currentTrips.length == 0" class="text-center text-grey">Рейсів в роботі немає.</div>
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
const trips = ref([])
const finishedStatuses = ref([])
const curTrips = ref([])
const tripsLoading = ref(true) 
const finishedStatusesLoading = ref(true)
const allTrips = ref([])


onMounted(async () => {
    try {
        await appStore.pullTripsData()
        const selector = { ... await appStore.getUserSelector() }
        // Доступні рейси
        const options = {
            selector,
            fields: ['_id']
        }
        tripsLoading.value = true
        trips.value = await appStore.availableTrips(options)
        tripsLoading.value = false
        // Кілометрів усього
        await allAvailableTrips()
        const docIds = allTrips.value.map(el => el._id) || []
        const optionsF = {
            selector: {
                _id: { $in: docIds },
                odometerStart: { $exists: true },
                odometerFinish: { $exists: true },
                odometerFinish: { $gt: 0 },
                status: { $eq: 300 }
            },
            fields: ['_id', 'odometerStart', 'odometerFinish']
        }
        finishedStatusesLoading.value = true
        finishedStatuses.value = await appStore.availableStatuses(optionsF)
        finishedStatusesLoading.value = false
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

const allAvailableTrips = async () => {
    const options = {
        selector: {
            ... await appStore.getUserSelector()
        },
        fields: ['_id', 'date']
    }
    try {
        allTrips.value = await appStore.availableTrips(options)
    } catch (e) {
        console.error(e)
    }
}


</script>