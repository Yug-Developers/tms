<template>
    <div class="container-fluid">
        <MainNavigation />
        <v-sheet elevation="0" max-width="600" rounded="lg" width="100%" class="text-center mx-auto">
            <v-container>
                <v-row>
                    <v-col>
                        <v-text-field v-model="tripId" label="№" @keyup.enter="getAvailableTripsById()"
                            outlined></v-text-field>
                    </v-col>
                    <v-col>
                        <v-menu v-model="menu" :close-on-content-click="false">
                            <template v-slot:activator="{ props }">
                                <v-text-field v-model="formatedDate2" label="Дата" prepend-icon="event" readonly
                                    v-bind="props"></v-text-field>
                            </template>
                            <v-date-picker v-model="date" :allowed-dates="allowedDates" title="Доступні дати маршрутів"
                                max="2030-03-20" min="2021-01-01"></v-date-picker>
                        </v-menu>


                    </v-col>
                </v-row>
                <v-row v-for="trip in currentTrips">
                    <v-col>
                        <TripBlk :trip="trip" />
                    </v-col>
                </v-row>
                <v-row v-if="currentTrips.length == 0">
                    <v-col>
                        Рейсів не знайдено
                    </v-col>
                </v-row>
            </v-container>
        </v-sheet>

    </div>
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


    const getAvailableTripsById = async () => {
    const options = {
        selector: {
            ... await appStore.getUserSelector(),
            _id: tripId.value
        }
    }
    trips.value = await appStore.availableTrips(options)
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
    trips.value = await appStore.availableTrips(options)
}

const allAvailableTrips = async () => {
    const options = {
        selector: {
            ... await appStore.getUserSelector()
        },
        fields: ['_id', 'date']
    }
    allTrips.value = await appStore.availableTrips(options)
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