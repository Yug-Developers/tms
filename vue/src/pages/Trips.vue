<template>
    <MainNavigation />
    <v-layout full-height class="align-center">
        <v-container class="align-self-stretch">
            <v-sheet elevation="0" max-width="600" class="mx-auto mb-4">
                <h2 class="mb-4">Рейси</h2>
            </v-sheet>
            <v-sheet elevation="0" max-width="600" class="d-flex mx-auto mb-4">
                <v-text-field v-model="tripId" label="№" @keyup.enter="getAvailableTripsById()" outlined
                    clearable></v-text-field>
                <v-menu v-model="menu" :close-on-content-click="false">
                    <template v-slot:activator="{ props }">
                        <v-text-field v-model="formatedDate2" label="На дату" prepend-icon="event" readonly
                            v-bind="props"></v-text-field>
                    </template>
                    <v-date-picker v-model="date" :allowed-dates="allowedDates" title="Рейси на дату"
                        header="Оберіть дату" max="2030-03-20" min="2024-01-01"></v-date-picker>
                </v-menu>
            </v-sheet>
            <div v-for="trip in currentTrips">
                <TripBlk :trip="trip" />
            </div>
            <div v-if="currentTrips.length == 0" class="text-center">
                <span v-if="tripIdError">По № <b>{{tripId }}</b> </span>
                <span v-else>На дату <b>{{ formatedDate2 }}</b> </span>
                рейсів не знайдено
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
const date = ref()
const tripId = ref('')
const trips = ref([])
const allTrips = ref([])
const menu = ref(false)
const tripIdError = ref(false)

const getAvailableTripsById = async () => {
    const options = {
        selector: {
            ... await appStore.getUserSelector(),
            _id: tripId.value.trim()
        }
    }
    try {
        appStore.loading = true
        trips.value = await appStore.availableTrips(options)
        if (trips.value.length == 0) {
            tripIdError.value = true
        } else {
            tripIdError.value = false
        }
    } catch (e) {
        console.log(e)
    }
    setTimeout(() => {
        appStore.loading = false
    }, 500)
}

const getAvailableTrips = async () => {
    tripId.value = ''
    menu.value = false
    const options = {
        selector: {
            ... await appStore.getUserSelector(),
            date: formatedDate()
        }
    }
    try {
        appStore.loading = true
        trips.value = await appStore.availableTrips(options)
    } catch (e) {
        console.log(e)
    }
    setTimeout(() => {
        appStore.loading = false
    }, 500)
}

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
        console.log(e)
    }
}

const currentTrips = computed(() => {
    return trips.value && trips.value.map(el => { return { doc: el, id: el._id, key: el._id } }) || []
})

const formatedDate = () => {
    //13.03.2024 to 2024-03-13
    return adapter.format(date.value, 'keyboardDate').split('.').reverse().join('-')
}
const formatedDate2 = computed(() => {
    return adapter.format(date.value, 'keyboardDate')
})

const allowedDates = computed(() => {
    return allTrips.value.map(el => el.date)
})

watch(date, async () => {
    await getAvailableTrips()
})

onMounted(async () => {
    await appStore.pullTripsData()
    await allAvailableTrips()
    await getAvailableTrips()
})

</script>