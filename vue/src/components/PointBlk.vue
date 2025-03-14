<template>
    <v-sheet v-if="point.id" style="cursor:pointer" @click="goToPoint(point.id)" elevation="4" max-width="600" rounded
        width="100%" class="pa-4 mx-auto">
        <v-card flat>
            <v-card-title class="d-flex justify-space-between pa-0 pb-2">
                <div># {{ point.sortNumber }}</div>
                <span v-if="point.pointType == 'wh'" class="text-caption font-weight-bold">СКЛАД</span>
                <StatusChip :tripId="tripId" :pointId="pointId" />
            </v-card-title>
            <v-card-text class="pa-0 text-left mx-auto">
                <div class="d-flex justify-space-between align-end mb-2">
                    <div>
                        <div v-if="point.pointType != 'wh'"><b>Контрагент:</b> {{ point.counterpartyName }}</div>
                        <div><b>Адреса:</b> {{ point.address }} <span v-if="point.description">({{ point.description
                                }})</span></div>
                        <div v-if="point.rcpt"><b>Отримувач:</b> {{ point.rcpt }},
                            <div class="d-flex flex-wrap">
                                <span class="d-flex flex-nowrap pr-2"
                                    v-for="phone in appStore.parsePhones(point.rcptPhone)">
                                    <v-icon size="x-small" icon="mdi-phone" class="mr-1 mt-1" color="green" />
                                    <a :href="'tel:' + phone" @click.stop>{{
                                        phone }}</a>
                                </span>
                            </div>
                        </div>
                    </div>
                    <v-btn :disabled="coordinates ? false : true" @click.stop="openGoogleMap(coordinates)"
                        title="На карті" variant="text" icon="mdi-google-maps"></v-btn>
                </div>
                <v-row v-if="point.pointType != 'wh'" class="mb-2 text-left">
                    <v-col class="d-flex flex-nowrap">
                        Видача <v-badge :color="docTypeOutPoint == 0 ? `grey` : `info`" :content="docTypeOutPoint"
                            inline></v-badge>
                    </v-col>
                    <v-col class="d-flex flex-nowrap">
                        Повернення <v-badge :color="docTypeInPoint == 0 ? `grey` : `info`" :content="docTypeInPoint"
                            inline></v-badge>
                    </v-col>
                    <v-col class="d-flex flex-nowrap">
                        Завдання <v-badge :color="docTypeTaskPoint == 0 ? `grey` : `info`" :content="docTypeTaskPoint"
                            inline></v-badge>
                    </v-col>
                </v-row>
                <div class="text-caption d-flex justify-space-between">
                    <div><v-icon x-small class="green mr-2 mb-1">mdi-timer-check-outline</v-icon>{{ pointTime }}</div>
                    <div v-if="point.sortNumber != '1'"><v-icon x-small icon="mdi-map-marker-distance" /> <span
                        v-if="distance">{{ distance }}</span><span v-else>-</span> км</div>
                </div>
            </v-card-text>
        </v-card>
    </v-sheet>
    <!-- <pre>{{ point }}</pre> -->
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import StatusChip from './PointStatusChip.vue'
import { useAppStore } from '../store/appStore'
const appStore = useAppStore()
const router = useRouter()
const props = defineProps({
    tripId: String,
    point: Object,
    points: Array,
    statuses: Object,
})

const goToPoint = (id) => {
    router.push(`/trip/${props.tripId}/${id}`)
}

const openGoogleMap = (url) => {
    window.open(url, '_blank')
}

const docTypeInPoint = computed((id) => {
    return props.point.docs.reduce((acc, item) => {
        if (item.docType == 'in') {
            return acc + 1
        } else {
            return acc
        }
    }, 0)
})

const docTypeOutPoint = computed((id) => {
    return props.point.docs.reduce((acc, item) => {
        if (item.docType == 'out' || item.docType == 'out_RP') {
            return acc + 1
        } else {
            return acc
        }
    }, 0)
})

const docTypeTaskPoint = computed((id) => {
    return props.point.docs.reduce((acc, item) => {
        if (item.docType == 'task') {
            return acc + 1
        } else {
            return acc
        }
    }, 0)
})

const distance = computed(() => {
    let distance = 0
    if (props.points) {
        const index = props.points.findIndex((item) => item.id == props.point.id)
        if (index > 0) {
            distance = props.points[index - 1].distance
        }
    }
    return distance
})

const pointTime = computed(() => {
    const points = props.statuses.points || []
    const pointStatus = points.find(el => el.id === Number(props.point.id)) || {}
    if (pointStatus.arrivalTime && pointStatus.departureTime) {
        //вирахувати різницю в часі
        const arrival = new Date(pointStatus.arrivalTime)
        const departure = new Date(pointStatus.departureTime)
        const diff = Math.abs(departure - arrival) / 1000
        const minutes = (Math.floor(diff / 60) % 60) || 1
        const hours = Math.floor(diff / 3600)
        if (hours) {
            return hours + ' год ' + minutes + ' хв'
        } else {
            return minutes + ' хв'
        }
    } else {
        return '-'
    }
})

const pointId = computed(() => {
    return props.point.id
})

const coordinates = computed(() => {
    if (!props.point.coordinates) {
        return
    }
    return 'https://www.google.com/maps?q=' + props.point.coordinates.latitude + ',' + props.point.coordinates.longitude
})


</script>