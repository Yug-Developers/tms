<template>
    <MainNavigation />
    <v-layout full-height>
        <template v-if="tripData.doc">
            <v-container>
                <v-row class="mb-4">
                    <v-col>
                        <TripHeader :trip="tripData" />
                    </v-col>
                </v-row>
                <v-row v-if="tripData.doc.points" v-for="point in tripData.doc.points" class="my-0">
                    <v-col class="pt-2">
                        <PointBlk :point="point" :points="tripData.doc.points" :statuses="statuses"
                            :tripId="tripData && tripData.id" />
                    </v-col>
                </v-row>
            </v-container>
        </template>
        <template v-if="!doc">
            <v-container class="d-flex align-self-center">
                <v-card elevation="0" max-width="400" class="mx-auto">
                    <v-icon class="mx-4 text-primary" size="x-large">mdi-alert</v-icon>
                    <v-card-text class="text-primary py-0">Рейс не знайдено</v-card-text>
                    <v-card-text class="pt-4 font-weight-bold">Рейса {{ tripId }} не існує!</v-card-text>
                    <v-card-text>Неправильно вказано номер рейса або такого рейса не існує</v-card-text>
                    <v-card-text>Перейдіть на головну сторінку або оберіть потрібний розділ</v-card-text>
                </v-card>
            </v-container>
        </template>
    </v-layout>
</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
import TripHeader from '@/components/TripHeader.vue'
import PointBlk from '@/components/PointBlk.vue'
import { useAppStore } from '../store/appStore'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const tripData = ref({})
const doc = ref({})
const statuses = ref({})
const tripId = ref(route.params.id)
const trips = ref([])


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
        // Якщо рейсу не знайдено в поточних рейсах
        if (!trips.value.find(trip => trip._id === tripId.value)) {
            doc.value = null
            //перенаправити на сторінку з помилкою 403
            router.push('/403')
            return
        }
        doc.value = await appStore.getTripDoc(tripId.value)
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


