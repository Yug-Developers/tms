<template>
    <div class="container-fluid">
        <MainNavigation />
        <v-container>
            <template v-if="trip && pointData && pointData.id">
                <PointHeader :point="pointData" :tripId="tripId" :points="points" :editor="isEditor" />
                <v-sheet elevation="0" max-width="600" width="100%" class="mt-10  text-center mx-auto">
                    <template v-for="(type) in types" :key="type">
                        <v-expansion-panels v-model="panel[type]" multiple class="py-2">
                            <v-expansion-panel>
                                <template v-slot:title>
                                    <div class="text-h6">{{ typesObj[type] }} - {{ docsData[type].length }}</div>
                                </template>

                                <template v-slot:text>
                                    <template v-if="docsData[type].length">
                                        <v-card-text class="text-left pa-1" v-for="doc in docsData[type]" :key="doc.id">
                                            <v-sheet :style="isEditor ? `cursor: pointer` : ``" :elevation="1"
                                                @click="selectDoc(doc.id)">
                                                <v-table density="compact"
                                                    :class="docsSelected[doc.id] ? `bg-teal-lighten-5` : ``">
                                                    <tbody>
                                                        <tr>
                                                            <td width="40%">Документ</td>
                                                            <td width="60%">{{ doc.id }}</td>
                                                        </tr>
                                                        <tr v-if="type == 'out'">
                                                            <td>ВН</td>
                                                            <td>{{ doc.taxNumber }}</td>
                                                        </tr>
                                                        <tr>
                                                            <td>Статус</td>
                                                            <td>
                                                                <StatusChip :tripId="tripId" :pointId="pointId"
                                                                    :docId="doc.id" />
                                                            </td>
                                                        </tr>

                                                        <tr v-if="type != 'task'">
                                                            <td>Вага / Об’єм</td>
                                                            <td>{{ doc.weight }} / {{ doc.volume }}</td>
                                                        </tr>
                                                        <tr v-if="type == 'out'">
                                                            <td>Кількість кор. / пал.</td>
                                                            <td>{{ doc.boxes }} / {{ doc.pallets }}</td>
                                                        </tr>
                                                        <tr v-if="type != 'in'">
                                                            <td>Сума COD</td>
                                                            <td>{{ doc.sum }}</td>
                                                        </tr>
                                                        <tr v-if="doc.tasks && doc.tasks.length">
                                                            <td class="font-weight-bold">Завдання:</td>
                                                            <td></td>
                                                        </tr>
                                                        <tr v-if="doc.tasks && doc.tasks.length"
                                                            v-for="(task) in doc.tasks" @click.stop="">
                                                            <td></td>
                                                            <td><v-checkbox v-model="tasks[`${doc.id}_${task.id}`]"
                                                                    :label="task.name"></v-checkbox></td>
                                                        </tr>

                                                        <tr @click.stop="">
                                                            <td colspan="2">
                                                                <v-card-actions v-if="isEditor">
                                                                    <v-btn prepend-icon="mdi-check"
                                                                        v-if="docStatuses[doc.id] && docStatuses[doc.id].status == '200' && btnsRules"
                                                                        @click="release(doc.id)"
                                                                        color="success">Видано</v-btn>
                                                                    <v-spacer></v-spacer>
                                                                    <v-btn prepend-icon="mdi-close"
                                                                        v-if="docStatuses[doc.id] && docStatuses[doc.id].status == '200' && btnsRules"
                                                                        color="primary"
                                                                        @click="reject(doc.id)">Відмова</v-btn>
                                                                    <v-btn prepend-icon="mdi-cross"
                                                                        v-if="docStatuses[doc.id] && docStatuses[doc.id].status == '200' && btnsRules"
                                                                        color="warning"
                                                                        @click="cancel(doc.id)">Скасування</v-btn>
                                                                </v-card-actions>

                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </v-table>
                                            </v-sheet>
                                        </v-card-text>
                                    </template>

                                    <template v-else>
                                        <v-card-text class="text-left">
                                            <div>Документів немає</div>
                                        </v-card-text>
                                    </template>
                                </template>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </template>
                </v-sheet>
            </template>

            <template v-if="!trip">
                <v-row>
                    <v-col class="text-center pa-10 text-h6">
                        <v-alert color="error">Немає даних по рейсу {{ tripId }}</v-alert>
                    </v-col>
                </v-row>
            </template>

            <template v-if="points.length && !pointData">
                <v-row>
                    <v-col class="text-center pa-10 text-h6">
                        <v-alert color="error">Немає даних по точці {{ pointId }}</v-alert>
                    </v-col>
                </v-row>
            </template>
        </v-container>
        <pre>{{ appStore.statuses.filter(el => el._id == tripId) }}</pre>
        <v-bottom-navigation :active="bottomNavigation" v-model="bottomModel">
            <v-btn color="success" :disabled="releaseBottomBtn" @click="massReleaseDialog = true">
                <v-icon>mdi-check</v-icon>
                Видано
            </v-btn>
            <v-btn color="primary" :disabled="rejectBottomBtn" @click="massRejectDialog = true">
                <v-icon>mdi-close</v-icon>
                Відмова
            </v-btn>

            <v-btn color="primary" :disabled="cancelBottomBtn" @click="massCancelDialog = true">
                <v-icon>mdi-cross</v-icon>
                Скасування
            </v-btn>
        </v-bottom-navigation>

        <v-dialog v-model="acceptDocDialog" max-width="600" persistent>
            <v-card>
                <v-card-title>
                    Підтвердити
                </v-card-title>
                <v-form v-model="isFormValid">
                    <v-card-text v-if="curDoc.docType == 'out' || curDoc.docType == 'in'">
                        <v-row>
                            <v-col>
                                <v-text-field v-model="curBoxes" :rules="[rules.number]" label="кількість коробок"
                                    outlined></v-text-field>
                            </v-col>
                            <v-col>
                                <v-text-field v-model="curPallets" :rules="[rules.number]" label="кількість палет"
                                    outlined></v-text-field>
                            </v-col>
                        </v-row>
                    </v-card-text>
                    <v-card-text v-if="curDoc.sum">
                        Прийнято COD:
                        <v-row>
                            <v-col>
                                <v-text-field v-model="sumPack" label="Пакет №" outlined></v-text-field>
                            </v-col>
                            <v-col>
                                <v-text-field v-model="sumFact" label="Сума" outlined></v-text-field>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-form>
                <v-card-actions>
                    <v-btn color="grey" @click="cancelSmsDialog()">Відмінити</v-btn>
                    <v-btn @click="acceptRelease()" :disabled="isFormValid ? false : true">Підтвердити</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="rejectDialog" max-width="600">
            <v-card>
                <v-card-title>
                    Відмова
                </v-card-title>
                <v-card-text>
                    <v-textarea v-model="rejectText" label="Причина відмови клієнта" outlined></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="rejectDialog = false">Скасувати</v-btn>
                    <v-btn @click="rejectDoc()">Підтвердити</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="cancelDialog" max-width="600">
            <v-card>
                <v-card-title>
                    Скасування
                </v-card-title>
                <v-card-text>
                    <v-textarea v-model="cancelText" label="Причина, чому документ не доставлено клієнту:"
                        outlined></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="cancelDialog = false">Назад</v-btn>
                    <v-btn @click="cancelDoc()">Підтвердити</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="massRejectDialog" max-width="600">
            <v-card>
                <v-card-title>
                    Відмова
                </v-card-title>
                <v-card-text>
                    <v-textarea v-model="rejectText" label="Причина відмови клієнта" outlined></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="rejectDialog = false">Назад</v-btn>
                    <v-btn @click="massReject()">Підтвердити</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="massCancelDialog" max-width="600">
            <v-card>
                <v-card-title>
                    Скасування
                </v-card-title>
                <v-card-text>
                    <v-textarea v-model="cancelText" label="Причина, чому документ не доставлено клієнту:"
                        outlined></v-textarea>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="cancelDialog = false">Назад</v-btn>
                    <v-btn @click="massCancel()">Підтвердити</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="massReleaseDialog" max-width="600">
            <v-card>
                <v-card-title>
                    Підтвердити
                </v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col>
                            <v-text-field v-model="allBoxes" readonly label="кількість коробок" outlined></v-text-field>
                        </v-col>
                        <v-col>
                            <v-text-field v-model="allPallets" readonly label="кількість палет" outlined></v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="massReleaseDialog = false">Назад</v-btn>
                    <v-btn @click="acceptMassRelease()">Підтвердити</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="acceptSmsDialog" max-width="600" persistent>
            <v-card>
                <v-card-title>
                    Підтвердити
                </v-card-title>
                <v-card-text v-if="statusConnection">
                    <div>Вам надіслано SMS для підтвердження</div>
                    <v-row>
                        <v-col>
                            <v-text-field label="Код з SMS" v-model="smsCode" style="width: 120px"
                                outlined></v-text-field>
                        </v-col>
                        <v-col>
                            <v-progress-circular v-if="timer !== 0" :model-value="timer" :rotate="360" :size="50"
                                :width="5" color="teal">
                                {{ timer / 100 * 60 }}
                            </v-progress-circular>
                            <v-btn v-if="timer === 0" @click="sendSMS()">Відправити SMS повторно</v-btn>
                        </v-col>
                    </v-row>

                </v-card-text>
                <v-card-actions>
                    <v-btn color="grey" @click="acceptSmsDialog = false">Скасувати</v-btn>
                    <v-btn @click="accept()">Підтвердити</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
import PointHeader from '@/components/PointHeader.vue'
import StatusChip from '@/components/DocumentStatusChip.vue'
import { onMounted, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import cyrillicToTranslit from 'cyrillic-to-translit-js'
import md5 from 'md5'

const appStore = useAppStore()
const route = useRoute()
const pointData = ref({})
const points = ref([])
const docs = ref([])
const panel = ref({})
const types = ['out', 'in', 'task']
const typesObj = {
    out: 'Видача',
    in: 'Прийом',
    task: 'Завдання'
}
const docsSelected = ref({})
const bottomModel = ref(null)
const trip = ref({})
const tripId = ref(route.params.id)
const pointId = ref(route.params.point)
const curDoc = ref({})
const acceptDocDialog = ref(false)
const massReleaseDialog = ref(false)
const sumPack = ref('')
const sumFact = ref('')
const curPallets = ref('')
const curBoxes = ref('')
const statusConnection = ref(null)
const rejectDialog = ref(false)
const cancelDialog = ref(false)
const rejectText = ref('')
const cancelText = ref('')
const tasks = ref({})
const massRejectDialog = ref(false)
const massCancelDialog = ref(false)
const checkSmsHash = ref('')
const acceptSmsDialog = ref(false)
const acceptFunc = ref(null)
const smsCode = ref('')
const interval = ref({})
const timer = ref(100)
const isFormValid = ref(false)

onMounted(async () => {
    try {
        await appStore.pullTripsData()
        trip.value = await appStore.getTripDoc(tripId.value)
        //Поточні данні документу рейсу
        if (trip.value && trip.value.points) {
            //точки документу рейсу
            points.value = trip.value.points
            //поточна точка документу рейсу
            pointData.value = trip.value.points.find((item) => item.id == pointId.value)
            //документи поточної точки документу рейсу
            docs.value = pointData.value && pointData.value.docs
            //задачі усіх документов точки
            tasks.value = pointData.value && pointData.value.docs.reduce((acc, item) => {
                if (item.tasks && item.tasks.length) {
                    for (let task of item.tasks) {
                        acc[`${item.id}_${task.id}`] = false
                    }
                }
                return acc
            }, {})
        }
    }
    catch (error) {
        console.error(error)
    }
})

const rules = {
    number: v => v && !isNaN(v) && !/\s+/.test(v) || 'Тільки цифри'
}


const selectDoc = (id) => {
    if (!isEditor.value) return
    if (docsSelected.value[id]) {
        delete docsSelected.value[id]
    } else {
        docsSelected.value[id] = true
    }
}

const release = (docId) => {
    sumPack.value = ''
    sumFact.value = ''
    curPallets.value = ''
    curBoxes.value = ''
    curDoc.value = {}
    if (docTasks(docId)) {
        const curDocument = docs.value.find((item) => item.id == docId)
        curDoc.value = curDocument
        statusConnection.value = navigator.onLine
        curPallets.value = curDocument.pallets
        curBoxes.value = curDocument.boxes
        sumPack.value = curDocument.sumPack
        sumFact.value = curDocument.sumFact
        acceptDocDialog.value = true
    } else {
        appStore.setSnackbar({ text: "Не всі завдання виконані", type: 'error' })
    }
}

const cancelSmsDialog = () => {
    clearInterval(interval.value)
    acceptSmsDialog.value = false
    acceptDocDialog.value = false
}

const sendSMS = async () => {
    //Відправити SMS
    const [code, hash] = await appStore.createCode()
    checkSmsHash.value = hash
    const message = curDoc.value.docType == 'out' ?
        `видав ${curBoxes.value} кор / ${curPallets.value} пал` :
        (curDoc.value.docType == 'in' ? `прийняв ${curBoxes.value} кор / ${curPallets.value} пал` : ``)
    const messageSum = sumFact.value ? `прийняв ${sumFact.value} грн (№ пакету ${sumPack.value})` : ``
    const codeText = `Код: ${code}`
    const coma = messageSum && message ? `, ` : ``
    const translit = cyrillicToTranslit({ preset: "uk" }).transform(`Водій ${message}${coma}${messageSum}. ${codeText}`)
    console.log(translit)
    timer.value = 100
    interval.value = setInterval(() => {
        if (timer.value === 0) {
            clearInterval(interval.value)
        } else {
            timer.value -= 5
        }
    }, 600 * 5)

    // await appStore.sendSMScode({ phone: pointData.value.rcptTel, message: translit })
}

const sendMassSMS = async () => {
    //Відправити SMS
    const [code, hash] = await appStore.createCode()
    checkSmsHash.value = hash
    const message = `видав ${allBoxes.value} кор / ${allPallets.value} пал`
    const codeText = `Код: ${code}`
    const translit = cyrillicToTranslit({ preset: "uk" }).transform(`Водій ${message}. ${codeText}`)
    console.log(translit)
    timer.value = 100
    interval.value = setInterval(() => {
        if (timer.value === 0) {
            clearInterval(interval.value)
        } else {
            timer.value -= 5
        }
    }, 600 * 5)

    // await appStore.sendSMScode({ phone: pointData.value.rcptTel, message: translit })
}

const accept = async () => {
    try {
        acceptFunc.value()
    } catch (error) {
        console.error(error)
    }
}
const acceptRelease = async () => {
    try {
        if (navigator.onLine) {
            await sendSMS()
            acceptFunc.value = releaseDoc
            acceptDocDialog.value = false
            acceptSmsDialog.value = true
        } else {
            await releaseDoc()
            acceptDocDialog.value = false
        }
    } catch (error) {
        console.error(error)
    }
}

const releaseDoc = async () => {
    try {
        if (checkSmsCode.value) {
            await appStore.releaseDoc({
                tripId: tripId.value,
                pointId: pointId.value,
                docId: curDoc.value.id,
                sumPack: sumPack.value,
                sumFact: sumFact.value,
                palletsFact: curPallets.value,
                boxesFact: curBoxes.value,
                statusConnection: statusConnection.value
            })
            acceptSmsDialog.value = false
            acceptDocDialog.value = false
            appStore.setSnackbar({ text: "Документ відпущено", type: 'success' })
        } else {
            appStore.setSnackbar({ text: "Невірний код з SMS", type: 'error' })
        }
    } catch (error) {
        console.error(error)
    }
}

const reject = (docId) => {
    const curDocument = docs.value.find((item) => item.id == docId)
    curDoc.value = curDocument
    rejectDialog.value = true
}

const rejectDoc = async () => {
    try {
        await appStore.rejectDoc({
            tripId: tripId.value,
            pointId: pointId.value,
            docId: curDoc.value.id,
            description: rejectText.value
        })
        rejectDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const cancel = (docId) => {
    const curDocument = docs.value.find((item) => item.id == docId)
    curDoc.value = curDocument
    cancelDialog.value = true
}

const cancelDoc = async () => {
    try {
        await appStore.cancelDoc({
            tripId: tripId.value,
            pointId: pointId.value,
            docId: curDoc.value.id,
            description: cancelText.value
        })
        cancelDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const docTasks = (docId) => {
    //Документа всі Завдання мають status = Виконано, або немає завдань
    const curDocument = docs.value.find((item) => item.id == docId)
    if (curDocument.tasks && curDocument.tasks.length) {
        return curDocument.tasks.every((item) => tasks.value[`${docId}_${item.id}`])
    } else {
        return true
    }
}

const acceptMassRelease = async () => {
    try {
        if (navigator.onLine) {
            await sendMassSMS()
            acceptFunc.value = massRelease
            massReleaseDialog.value = false
            acceptSmsDialog.value = true
            statusConnection.value = navigator.onLine
        } else {
            await massRelease()
            acceptDocDialog.value = false
        }
    } catch (error) {
        console.error(error)
    }
}

const massRelease = async () => {
    try {
        for (let docId of Object.keys(docsSelected.value)) {
            const curDoc = docs.value.find((item) => item.id == docId)
            await appStore.releaseDoc({
                tripId: tripId.value,
                pointId: pointId.value,
                docId,
                palletsFact: curDoc.pallets,
                boxesFact: curDoc.boxes,
                statusConnection: navigator.onLine
            })
        }
        docsSelected.value = {}
        massReleaseDialog.value = false
        acceptSmsDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const massReject = async () => {
    try {
        for (let docId of Object.keys(docsSelected.value)) {
            await appStore.rejectDoc({
                tripId: tripId.value,
                pointId: pointId.value,
                docId,
                description: rejectText.value
            })
        }
        docsSelected.value = {}
        massRejectDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const massCancel = async () => {
    try {
        for (let docId of Object.keys(docsSelected.value)) {
            await appStore.cancelDoc({
                tripId: tripId.value,
                pointId: pointId.value,
                docId,
                description: cancelText.value
            })
        }
        docsSelected.value = {}
        massCancelDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const statuses = computed(() => {
    return appStore.statuses.find((item) => item._id == tripId.value)
})

const outData = computed(() => {
    return docs.value.filter((item) => item.docType == 'out')
})

const inData = computed(() => {
    return docs.value.filter((item) => item.docType == 'in')
})

const taskData = computed(() => {
    return docs.value.filter((item) => item.docType == 'task')
})

const docsData = computed(() => {
    return {
        out: outData.value,
        in: inData.value,
        task: taskData.value
    }
})

const bottomNavigation = computed(() => {
    // є хоч один вибраний документ selectDoc
    return Object.keys(docsSelected.value).length
})

const pointStatus = computed(() => {
    if (statuses.value) {
        const point = statuses.value.points.find((item) => item.id == pointId.value)
        return point && point.status
    } else {
        return false
    }
})
const docStatuses = computed(() => {
    const docStatusesObj = {}
    if (statuses.value) {
        const point = statuses.value.points.find((item) => item.id == pointId.value)
        if (point) {
            point.docs.forEach((item) => {
                docStatusesObj[item.id] = item
            })
        }
    }
    return docStatusesObj
})

const btnsRules = computed(() => {
    return pointStatus.value == 200
})

const completeAllSelectedTasks = computed(() => {
    //Усі вибрані документи мають всі завдання виконані
    let result = true
    for (let item of Object.keys(docsSelected.value)) {
        const docData = docs.value.find((doc) => doc.id == item)
        if (docData && docData.tasks && docData.tasks.length) {

            for (let task of docData.tasks) {
                if (!tasks.value[`${item}_${task.id}`]) {
                    result = false
                }
            }
        } else {
            result = true
        }
    }
    return result
})

const releaseBottomBtn = computed(() => {
    let result = true
    for (let item of Object.keys(docsSelected.value)) {
        const docData = docs.value.find((doc) => doc.id == item)
        if (docStatuses.value[item] && docStatuses.value[item].status == 200 && !docData.sum && docData.docType == 'out' && completeAllSelectedTasks.value) {
            result = false
        } else {
            return true
        }
    }
    return result
})

const cancelBottomBtn = computed(() => {
    let result = true
    for (let item of Object.keys(docsSelected.value)) {
        if (docStatuses.value[item] && docStatuses.value[item].status == 200) {
            result = false
        } else {
            return true
        }
    }
    return result
})

const rejectBottomBtn = computed(() => {
    let result = true
    for (let item of Object.keys(docsSelected.value)) {
        if (docStatuses.value[item] && docStatuses.value[item].status == 200) {
            result = false
        } else {
            return true
        }
    }
    return result
})

// сума КОРОБОК усіх вибраних доументів
const allBoxes = computed(() => {
    let result = 0
    for (let item of Object.keys(docsSelected.value)) {
        const docData = docs.value.find((doc) => doc.id == item)
        if (docData.boxes) result += docData.boxes
    }
    return result
})

// сума ПАЛЕТ усіх вибраних доументів
const allPallets = computed(() => {
    let result = 0
    for (let item of Object.keys(docsSelected.value)) {
        const docData = docs.value.find((doc) => doc.id == item)
        if (docData.pallets) result += docData.pallets
    }
    return result
})

const checkSmsCode = computed(() => {
    return navigator.onLine ? md5(smsCode.value) == checkSmsHash.value : true
})

const isEditor = computed(() => {
    return trip.value.editor == appStore.user_id
})

</script>