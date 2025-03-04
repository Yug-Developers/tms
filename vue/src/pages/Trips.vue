<template>
    <MainNavigation />
    <v-layout full-height class="align-center">
        <v-container class="align-self-stretch" max-width="600">
            <v-sheet elevation="0" class="mx-auto mb-4 bg-transparent">
                <h2 class="mb-4">Рейси</h2>
            </v-sheet>
            <v-row elevation="0" class="d-flex mx-auto mb-4" no-gutters>
                <v-col col="6" class="pr-2">
                    <v-text-field v-model="tripId" label="№" @keyup.enter="getAvailableTripsById()" outlined
                        clearable></v-text-field>
                </v-col>
                <v-col col="6" class="pl-2">
                    <v-menu v-model="menu" :close-on-content-click="false">
                        <template v-slot:activator="{ props }">
                            <v-text-field v-model="formatedDate2" label="На дату" readonly
                                v-bind="props"></v-text-field>
                        </template>
                        <v-date-picker @update:modelValue="getAvailableTripsByDate" v-model="date"
                            :allowed-dates="allowedDates" title="Рейси на дату" header="Оберіть дату" max="2030-03-20"
                            min="2024-01-01"></v-date-picker>
                    </v-menu>
                </v-col>
            </v-row>
            <div v-for="trip in currentTrips">
                <TripBlk :trip="trip" />
            </div>
            <div v-if="currentTrips.length == 0" class="text-center">
                <span v-if="tripIdError && tripId">По № <b>{{ tripId }}</b> рейси не знайдено</span>
                <span v-if="tripDateError && date">На дату <b>{{ formatedDate2 }}</b> рейси не знайдено</span>
                <span v-if="!date && !tripId" class="text-grey">Укажіть № чи дату рейса</span>
            </div>
        </v-container>
    </v-layout>
</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
import { useAppStore } from '@/store/appStore'
import { ref, onMounted, computed, watch } from 'vue'
import { useDate } from 'vuetify'
import TripBlk from '@/components/TripBlk.vue'

const appStore = useAppStore()
const adapter = useDate()
const date = ref(null)
const tripId = ref('')
const menu = ref(false)
const tripIdError = ref(false)
const tripDateError = ref(false)
const currentTrips = ref([])


const getAvailableTripsById = async () => {
    date.value = null
    try {
        appStore.loading = true
        const availableTripsIds = appStore.availableTrips || []
        tripIdError.value = !availableTripsIds.includes(tripId.value)
        if (!tripIdError.value) {
            await appStore.pullTripsById([tripId.value])
        }
        currentTrips.value = appStore.routes.filter(el => el._id === tripId.value)
        appStore.loading = false
    } catch (e) {
        console.error(e)
    }
}

const getAvailableTripsByDate = async (newDate) => {
    menu.value = false
    tripId.value = ''
    try {
        const cdate = formatedDate(newDate || date.value)
        if (!appStore.offline) {
            const ids = await filterTripIdsByDate(cdate)
            await appStore.pullTripsById(ids)
        }
        currentTrips.value = appStore.routes.filter(el => el.date === cdate)
        if (currentTrips.value.length === 0) {
            tripDateError.value = true
        }
    } catch (e) {
        console.error(e)
    }
}

const filterTripIdsByDate = async (date) => {
    const data = appStore.tripsByDate.filter(el => el.value === date)
    return data?.map(el => el.id) || []
}

const formatedDate = (date) => {
    //13.03.2024 to 2024-03-13
    return adapter.format(date, 'keyboardDate').split('.').reverse().join('-')
}
const formatedDate2 = computed(() => {
    return date.value ? adapter.format(date.value, 'keyboardDate') : ''
})

const allowedDates = computed(() => {
    return appStore.tripsByDate.map(el => el.value)
})

onMounted(async () => {
    try {
        date.value = new Date()
        await appStore.pullTripsData()
        if (!appStore.ofline) {
            await appStore.getAllAvailableTrips()
        }
        await getAvailableTripsByDate()
    } catch (e) {
        console.error(e)
    }
})

</script>