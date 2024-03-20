<template>
    <div class="container-fluid">
        <MainNavigation />
        <v-container>
            <v-row v-if="tripData.doc">
                <v-col>
                    <TripHeader :trip="tripData" />
                </v-col>
            </v-row>
            <v-row v-if="tripData.doc && tripData.doc.points" v-for="point in tripData.doc.points">
                <v-col>
                    <PointBlk :point="point" :points="tripData.doc.points" :statuses="statuses" :tripId="tripData && tripData.id" />
                </v-col>
            </v-row>
            <v-row v-if="!doc">
                <v-col class="text-center pa-10 text-h6">
                    <v-alert color="error">Немає даних по рейсу {{ tripId }}</v-alert>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
import TripHeader from '@/components/TripHeader.vue'
import PointBlk from '@/components/PointBlk.vue'
import { useAppStore } from '../store/appStore'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const appStore = useAppStore()
const tripData = ref({})
const doc = ref({})
const statuses = ref({})
const tripId = ref(route.params.id)


onMounted(async () => {
    try {
        await appStore.pullTripsData()
        doc.value = await appStore.getTripDoc(tripId.value)
        console.log("tripData.doc", doc.value)
        statuses.value = await appStore.getTripStatusesDoc(tripId.value)
        tripData.value = {
            doc: doc.value,
            statuses: statuses.value,
            id: tripId.value,
            key: tripId.value
        }
    }
    catch (error) {
        console.error(error)
    }
})
</script>
