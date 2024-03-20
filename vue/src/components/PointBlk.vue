<template>
    <v-sheet v-if="point.id" style="cursor:pointer" @click="goToPoint(point.id)" elevation="12" max-width="600" rounded="lg" width="100%"
        class="pa-4 text-center mx-auto">
        <v-card flat>
            <v-card-title>
                Точка {{ point.id }} 
            </v-card-title>
            <v-card-text class="pa-4 text-left mx-auto">
                <div>Статус: <StatusChip :tripId="tripId" :pointId="pointId"/></div>
                <div>Тип: {{ point.pointType }}</div>
                <div>Адреса: {{ point.name }}</div>
                <div>Отримувач: {{ point.rcpt }} ({{ point.rcptTel }})</div>
                <div>Кількість видач: {{ docTypeOutPoint }}</div>
                <div>Кількість прийому: {{ docTypeInPoint }}</div>
                <div>Кількість завдань: {{ docTypeTaskPoint }}</div>
                <div>Відстань: {{ distance }}</div>

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
            return acc+1
        } else {
            return acc
        }
    }, 0)
})

const docTypeOutPoint = computed((id) => {
    return props.point.docs.reduce((acc, item) => {
        if (item.docType == 'out') {
            return acc+1
        } else {
            return acc
        }
    }, 0)
})

const docTypeTaskPoint = computed((id) => {
    return props.point.docs.reduce((acc, item) => {
        if (item.docType == 'task') {
            return acc+1
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
            distance = props.points[index-1].distance
        }
    }
    return distance
})

const pointId = computed(() => {
    return props.point.id
})

</script>