<template>
    <v-sheet v-if="point.id" style="cursor:pointer" @click="goToPoint(point.id)" elevation="4" max-width="600"
        rounded="sm" width="100%" class="pa-2 pa-sm-4 mx-auto mb-0">
        <v-card flat>
            <v-card-title class="d-flex justify-space-between pa-0 pb-2">
                <div># {{ point.sortNumber }}</div>
                <span v-if="point.pointType == 'wh'" class="text-caption font-weight-bold">СКЛАД</span>
                <StatusChip :tripId="tripId" :pointId="pointId" />
            </v-card-title>
            <v-card-text class="pa-0 text-left mx-auto">
                <!-- <div>Тип: {{ point.pointType }}</div> -->
                <div><b>Адреса:</b> {{ point.address }}</div>
                <div v-if="point.pointType != 'wh'"><b>Отримувач:</b> {{ point.rcpt }}, <span
                        class="d-flex flex-nowrap"><v-icon size="x-small" icon="mdi-phone" class="mr-1 mt-1"
                            color="green" />
                        <a :href="'tel:' + point.rcptPhone" @click.stop>{{ point.rcptPhone }}</a></span></div>
                <v-table v-if="point.pointType != 'wh'" density="compact" class="my-2 text-center">
                    <thead>
                        <tr>
                            <th class="text-center">
                                Видачі
                            </th>
                            <th class="text-center">
                                Забір
                            </th>
                            <th class="text-center">
                                Завдання
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{{ docTypeOutPoint }}</td>
                            <td>{{ docTypeInPoint }}</td>
                            <td>{{ docTypeTaskPoint }}</td>
                        </tr>
                    </tbody>
                </v-table>
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
        if (item.docType == 'out') {
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

</script>