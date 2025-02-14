<template>
    <v-sheet v-if="trip.id" elevation="0" max-width="600" rounded="lg" width="100%" class="pa-0 mx-auto bg-transparent">
        <v-card flat class="bg-transparent">
            <v-card-title class="d-flex justify-space-between pa-0 pb-1">
                <div>Рейс № {{ trip.id }}</div>
                <StatusChip :tripId="trip.id" />
            </v-card-title>
            <v-card-text class="text-grey text-caption pa-0">
                Дата рейсу: {{ appStore.formatDate(trip.doc.date) }}<br>
                Водій: {{ trip.doc.driverName }}<br>
                Відповідальний: {{ trip.doc.editorName }}<br>
            </v-card-text>
            <v-card-text class="pa-0 d-flex justify-space-between align-end">
                <div>
                    <div><b>На маршруті:</b> {{ trip.doc.points && trip.doc.points.length }} точок</div>
                    <div><v-icon size="x-small" color="grey"
                        class="mr-2">mdi-counter</v-icon><b>Кілометраж:</b> {{ tripLength(trip.doc._id) }} км</div>
                </div>
                <div class="text-right">
                    <v-btn :disabled="checkMapBtn() ? false : true" @click="openGoogleMap()" title="На карті"
                        variant="text" icon="mdi-map-search-outline"></v-btn>
                    <div v-if="trip.doc.isCircular || trip.doc.circular" class="text-caption text-grey">кільцевий</div>
                </div>
            </v-card-text>
            <v-card-text v-if="tripSatatus == 300" class="px-0 pb-0">
                <div><b>Факт виконання:</b></div>
                <div><v-icon size="x-small" color="green"
                    class="mr-2">mdi-counter</v-icon>Кілометраж: {{ tripLengthFact }} км</div>
                <div v-if="tripSatatus == 300">Показники одометру: <v-icon
                        size="x-small">mdi-contain-start</v-icon>{{ statuses.odometerStart }} ... {{
                            statuses.odometerFinish }}<v-icon size="x-small">mdi-contain-end</v-icon></div>
            </v-card-text>
        </v-card>
    </v-sheet>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import StatusChip from './TripStatusChip.vue'

const appStore = useAppStore()
const router = useRouter()
const props = defineProps({
    trip: Object
})
const statuses = ref({})
const tripLengthFact = ref(0)
const tripSatatus = ref(0)

const tripLength = (id) => {
    let length = 0
    if (props.trip && props.trip.doc && props.trip.doc.points) {
        length = props.trip.doc.points.reduce((acc, item) => {
            return item.id === -1 ? acc : acc + item.distance
        }, 0)
    }
    length = Math.round(length * 100) / 100
    return length
}

const getTripLengthFact = async () => {
    statuses.value = await appStore.getTripStatusesDoc(props.trip.id)
    if (statuses.value && statuses.value.odometerStart && statuses.value.odometerFinish) {
        tripSatatus.value = statuses.value.status
        return statuses.value.odometerFinish - statuses.value.odometerStart
    }
}
const checkMapBtn = () => {
    //якщо хоч одна точка не містить координати, то кнопка посилання має бути неактивним
    let result = true
    if (props.trip && props.trip.doc && props.trip.doc.points) {
        result = props.trip.doc.points.every(item => item.coordinates && item.coordinates.latitude && item.coordinates.longitude)
    }
    return result
}

const mapUrl = computed(() => {
      // Отримуємо масив координат з props.trip.doc.points
      const points = props.trip?.doc?.points || [];

      // Перетворюємо масив об'єктів у масив координат у форматі "latitude,longitude"
      const coordinates = points.map(point => 
        `${point.coordinates.latitude},${point.coordinates.longitude}`
      );

      // Формуємо URL для Google Maps
      const baseUrl = "https://www.google.com/maps/dir/";
      const url = baseUrl + coordinates.join('/');

      return url;
});

const openGoogleMap = () => {
    window.open(mapUrl.value, '_blank')
}
onMounted(async () => {
    tripLengthFact.value = await getTripLengthFact()
})

</script>

<style>
.v-sheet,
.v-card {
    background-color: white
}
</style>