<template>
    <MainNavigation />
    <v-layout>
        <template v-if="tripData.doc">
            <v-container>
                <v-row class="mb-4">
                    <v-col>
                        <TripHeader :trip="tripData" />
                    </v-col>
                </v-row>
                <v-sheet elevation="0" max-width="600" rounded="lg" width="100%"
                    class="pa-0 mx-auto d-flex justify-space-between align-center">
                    <v-switch v-if="notClosedPointsShow" v-model="notClosedPoins" class="ml-2">
                        <template v-slot:label>
                            <span class="text-caption">Тільки незавершені</span>
                        </template>
                    </v-switch>
                    <v-btn v-if="appStore.localStg.userData.role == 'manager'" prepend-icon="mdi-reload"
                        @click="reload()" :loading="reloadLoading" size="small">
                        Оновити рейс
                    </v-btn>
                </v-sheet>

                <!-- <pre>{{ statusess }}</pre> -->
                <v-row v-if="points" v-for="point in points" :key="point.id" class="my-0">
                    <v-col class="pt-2">
                        <PointBlk :point="point" :points="points" :statuses="statuses" :tripId="tripId" />
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
import { onMounted, ref, computed, toRaw } from 'vue'
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
const notClosedPoins = ref(true)
const reloadLoading = ref(false)

const reload = async () => {
    try {
        reloadLoading.value = true
        const start = await appStore.getTmsTripsById(tripId.value)
        const pid = start.content.pid
        appStore.setSnackbar({ text: "Оновлення данних маршруту розпочато", type: 'warning' });

        let attempts = 0
        const maxAttempts = 30  // Максимальна кількість спроб
        const intervalId = setInterval(async () => {
            attempts++
            const result = await appStore.checkTmsTripsProcess()
            console.log(result)

            if (result.content && result.content.status === 'finished' && result.content.pid === pid) { 
                appStore.setSnackbar({ text: "Оновлення данних маршруту завершено", type: 'success' });
                clearInterval(intervalId)  // зупиняємо інтервал
                reloadLoading.value = false
            } else if (attempts >= maxAttempts) {
                clearInterval(intervalId)  // зупиняємо інтервал
                reloadLoading.value = false
                appStore.setSnackbar({ text: "Не вдалося оновити дані!", type: 'error' });
            }
        }, 1000);

    } catch (error) {
        reloadLoading.value = false
        console.error(error)
        appStore.setSnackbar({ text: "Невдалось оновити данні", type: 'error' });
    }
}


const points = computed(() => {
    const points = tripData.value.doc.points
    return notClosedPoins.value && statuses.value && statuses.value.points ? points.filter(point => 
    statuses.value.points.find(el => el.id == point.id) 
    && statuses.value.points.find(el => el.id == point.id).status !== 300) : points
})

const notClosedPointsShow = computed(
    () => {
        if (statuses.value.points) {
            const flag = statuses.value.points.find(el => el.status !== 300)
            if (flag) { notClosedPoins.value = true }
            else { notClosedPoins.value = false }
            return flag
        } else {
            return false
        }
    }
)

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
        // Якщо рейсу не знайдено в доступних рейсах
        if (!trips.value.find(trip => trip._id == tripId.value)) {
            doc.value = null
            //перенаправити на сторінку з помилкою 403
            router.push('/403')
            return
        }
        await appStore.pullStatusesData([tripId.value])
        doc.value = await appStore.getTripDoc(tripId.value)
        statuses.value = await appStore.getTripStatusesDoc(tripId.value)
        if (doc.value.isCircular || doc.value.circular) {
            const firstPointCopy = { ...doc.value.points[0], id: -1, status: 100, sortNumber: doc.value.points.length + 1 }
            doc.value.points = [...doc.value.points, firstPointCopy];
        }
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
