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
                <div class="d-flex justify-space-between align-end">
                    <div>
                        <div><b>Контрагент:</b> {{ point.counterpartyName }}</div>
                        <div><b>Адреса:</b> {{ point.address }} <span v-if="point.description">({{ point.description }})</span></div>
                        <div v-if="point.pointType != 'wh'"><b>Отримувач:</b> {{ point.rcpt }}, <span
                                class="d-flex flex-nowrap"><v-icon size="x-small" icon="mdi-phone" class="mr-1 mt-1"
                                    color="green" />
                                <a :href="'tel:' + point.rcptPhone" @click.stop>{{ point.rcptPhone }}</a></span>
                        </div>
                    </div>
                    <v-btn :disabled="coordinates ? false : true" @click.stop="openGoogleMap(coordinates)" title="На карті"
                        variant="text" icon="mdi-google-maps"></v-btn>
                </div>
                <v-row v-if="point.pointType != 'wh'" class="my-2 text-left">
                    <v-col class="d-flex flex-nowrap">
                        Видача <v-badge :color="docTypeOutPoint == 0 ? `grey` : `info`" :content="docTypeOutPoint"
                            inline></v-badge>
                    </v-col>
                    <v-col class="d-flex flex-nowrap">
                        Забір <v-badge :color="docTypeInPoint == 0 ? `grey` : `info`" :content="docTypeInPoint"
                            inline></v-badge>
                    </v-col>
                    <v-col class="d-flex flex-nowrap">
                        Завдання <v-badge :color="docTypeTaskPoint == 0 ? `grey` : `info`" :content="docTypeTaskPoint"
                            inline></v-badge>
                    </v-col>
                </v-row>
                <div v-if="point.sortNumber != '1'" class="text-right"><v-icon icon="mdi-map-marker-distance" /> <span
                        v-if="distance">{{ distance }}</span><span v-else>-</span> км</div>

            </v-card-text>
        </v-card>
    </v-sheet>
    <!-- <pre>{{ point }}</pre> -->
</template>

<script setup>
import { defineProps, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import StatusChip from './PointStatusChip.vue'
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