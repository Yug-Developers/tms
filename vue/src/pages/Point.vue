<template>
    <MainNavigation />
    <v-layout full-height class="align-center">
        <v-container class="align-self-stretch">
            <template v-if="trip && pointData && pointData.id">
                <PointHeader :point="pointData" :tripId="tripId" :points="points" :editorId="isEditor" />
                <v-sheet v-if="pointData.pointType != 'wh'" elevation="0" max-width="600" width="100%" class="mx-auto">
                    <template v-for="(type) in types" :key="type">
                        <v-expansion-panels v-model="panel[type]" multiple class="mb-2">
                            <v-expansion-panel v-if="docsData[type].length != 0">
                                <template v-slot:title>
                                    <div class="text-subtitle">{{ typesObj[type] }}
                                        <v-badge color="info" :content="docsData[type].length" inline></v-badge>
                                    </div>
                                </template>
                                <template v-slot:text>
                                    <template v-if="docsData[type].length">
                                        <div class="text-left pa-0" flat v-for="doc in docsData[type]" :key="doc.id"
                                            :style="isEditor ? `cursor: pointer` : ``" :elevation="1"
                                            @click="selectDoc(doc.id)"
                                            :class="docsSelected[doc.id] ? `bg-teal-lighten-5` : ``">
                                            <div class="d-flex justify-space-between">
                                                <div>
                                                    <v-icon
                                                        :icon="docsSelected[doc.id] ? `mdi-check-circle-outline` : `mdi-circle-outline`"
                                                        color="green" class="mr-2 mb-1" />
                                                    <b>{{ doc.id }}</b>
                                                </div>
                                                <StatusChip :tripId="tripId" :pointId="pointId" :docId="doc.id" />
                                            </div>
                                            <div v-if="type == 'out' && doc.taxNumber" class="pl-8 text-caption">
                                                / ВН {{ doc.taxNumber }}
                                            </div>
                                            <v-table density="compact"
                                                :class="`my-2 text-center ` + (docsSelected[doc.id] ? `bg-teal-lighten-5` : ``)">
                                                <thead>
                                                    <tr>
                                                        <th v-if="type != 'task'" class="text-center">
                                                            Вага, кг
                                                        </th>
                                                        <th v-if="type != 'task'" class="text-center">
                                                            Об'єм, м3
                                                        </th>
                                                        <th v-if="type == 'out'" class="text-center">
                                                            Місць
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td v-if="type != 'task'">{{ doc.weight }}</td>
                                                        <td v-if="type != 'task'">{{ doc.volume }}</td>
                                                        <td v-if="type == 'out'">{{ doc.boxQty }} / {{ doc.pallQty }}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </v-table>
                                            <div v-if="type != 'in' && doc.sum">Сума COD: {{ doc.sum }} грн.</div>
                                            <v-table density="compact">
                                                <tbody>
                                                    <tr v-if="doc.tasks && doc.tasks.length">
                                                        <td class="font-weight-bold">Завдання:</td>
                                                        <td></td>
                                                    </tr>
                                                    <tr v-if="doc.tasks && doc.tasks.length" v-for="(task) in doc.tasks"
                                                        @click.stop="">
                                                        <td></td>
                                                        <td><v-checkbox v-model="tasks[`${doc.id}_${task.id}`]"
                                                                :label="task.name"></v-checkbox></td>
                                                    </tr>
                                                    <tr @click.stop="">
                                                        <td colspan="2">
                                                            <v-card-actions
                                                                v-if="isEditor && docStatuses[doc.id] && docStatuses[doc.id].status == '200' && btnsRules">
                                                                <v-btn prepend-icon="mdi-account-check-outline"
                                                                    @click="release(doc.id)"
                                                                    color="success">Видано</v-btn>
                                                                <v-spacer></v-spacer>
                                                                <v-btn color="grey"
                                                                    prepend-icon="mdi-account-remove-outline"
                                                                    class="text-none text-subtitle-2"
                                                                    @click="reject(doc.id)">
                                                                    <template v-slot:prepend>
                                                                        <v-icon color="primary"></v-icon>
                                                                    </template>

                                                                    Відм.</v-btn>
                                                                <v-btn color="grey"
                                                                    prepend-icon="mdi-truck-remove-outline"
                                                                    class="text-none text-subtitle-2"
                                                                    @click="cancel(doc.id)">
                                                                    <template v-slot:prepend>
                                                                        <v-icon color="primary"></v-icon>
                                                                    </template>

                                                                    Скас.</v-btn>
                                                            </v-card-actions>

                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </v-table>
                                        </div>
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
    </v-layout>
    <!-- <pre>{{ appStore.statuses.filter(el => el._id == tripId) }}</pre> -->
    <v-bottom-navigation :active="bottomNavigation" v-model="bottomModel">
        <v-btn :disabled="releaseBottomBtn" @click="openMassReleaseDialog()">
            <v-icon color="success">mdi-account-check-outline</v-icon>
            Видано
        </v-btn>
        <v-btn :disabled="rejectBottomBtn" @click="massRejectDialog = true">
            <v-icon color="primary">mdi-account-remove-outline</v-icon>
            Відмова
        </v-btn>

        <v-btn :disabled="cancelBottomBtn" @click="massCancelDialog = true">
            <v-icon color="primary">mdi-truck-remove-outline</v-icon>
            Скасування
        </v-btn>
    </v-bottom-navigation>

    <v-dialog v-model="acceptDocDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Видано
            </v-card-title>

            <v-form v-model="isFormValid">
                <v-card-text v-if="curDoc.docType == 'out' || curDoc.docType == 'in'">
                    <v-row>
                        <v-col>
                            <v-text-field v-model="curBoxes" :rules="[rules.number]" label="Коробок"
                                outlined></v-text-field>
                        </v-col>
                        <v-col>
                            <v-text-field v-model="curPallets" :rules="[rules.number]" label="Палет"
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
                <v-btn color="grey" @click="cancelSmsDialog()">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="acceptRelease()" :disabled="isFormValid ? false : true">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="rejectDialog" max-width="600">
        <v-card>
            <v-card-title>
                Відмова від отримання
            </v-card-title>
            <v-card-text>
                <v-textarea v-model="rejectText" label="Причина відмови одержувача" outlined></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-btn @click="rejectDialog = false" color="grey">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="rejectDoc()">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="cancelDialog" max-width="600">
        <v-card>
            <v-card-title>
                Скасування доставки
            </v-card-title>
            <v-card-text>
                <v-textarea v-model="cancelText" label="Причина, чому вантаж не доставлено одержувачу"
                    outlined></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="cancelDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="cancelDoc()">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="massRejectDialog" max-width="600">
        <v-card>
            <v-card-title>
                Відмова від отримання загалом
            </v-card-title>
            <v-card-text>
                <v-textarea v-model="rejectText" label="Причина відмови одержувача" outlined></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="rejectDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="massReject()">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="massCancelDialog" max-width="600">
        <v-card>
            <v-card-title>
                Скасування доставки загалом
            </v-card-title>
            <v-card-text>
                <v-textarea v-model="cancelText" label="Причина, чому вантаж не доставлено одержувачу:"
                    outlined></v-textarea>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="cancelDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="massCancel()">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="massReleaseDialog" max-width="600">
        <v-card>
            <v-card-title>
                Видано загалом
            </v-card-title>
            <v-card-text v-if="allBoxes || allPallets">
                <v-row>
                    <v-col>
                        <v-text-field v-model="allBoxes" readonly label="Коробок" outlined></v-text-field>
                    </v-col>
                    <v-col>
                        <v-text-field v-model="allPallets" readonly label="Палет" outlined></v-text-field>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-text v-if="allSum">
                Прийнято COD:
                <v-row>
                    <v-col>
                        <v-text-field v-model="allSumPack" label="Пакет №" outlined></v-text-field>
                    </v-col>
                    <v-col>
                        <v-text-field v-model="allSumFact" label="Сума, грн" outlined></v-text-field>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="massReleaseDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="allSum && (!allSumPack || !allSumFact)"
                    @click="acceptMassRelease()">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="acceptSmsDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Код підтвердження
            </v-card-title>
            <v-card-text v-if="statusConnection" class="px-2">
                <div class="mb-4">Одержувачу на тел. було надіслано SMS з Кодом підтвердження.</div>
                <div class="d-flex justify-space-between align-center">
                    <v-text-field label="Код з SMS" v-model="smsCode" style="width: 120px" outlined></v-text-field>
                    <v-progress-circular v-if="timer !== 0" :model-value="timer" :rotate="360" :size="50" :width="5"
                        color="teal">
                        {{ timer / 100 * 60 }}
                    </v-progress-circular>
                </div>
                <v-btn v-if="timer === 0" @click="sendSMS()">Відправити SMS повторно</v-btn>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="acceptSmsDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn v-if="timer != 0" @click="accept()">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
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
    in: 'Забір',
    task: 'Завдання'
}
const docsSelected = ref({})
const bottomModel = ref(null)
const trip = ref({})
const tripId = ref(route.params.id)
const pointId = ref(Number(route.params.point))
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
const allSumPack = ref('')
const allSumFact = ref('')

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
    number: v => (v === 0 || (v && !isNaN(v) && !/\s+/.test(v))) || 'Тільки цифри'
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
        curPallets.value = curDocument.pallQty
        curBoxes.value = curDocument.boxQty
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

    // await appStore.sendSMScode({ phone: pointData.value.rcptPhone, message: translit })
}

const sendMassSMS = async () => {
    //Відправити SMS
    const [code, hash] = await appStore.createCode()
    checkSmsHash.value = hash
    const message = `видав ${allBoxes.value} кор / ${allPallets.value} пал`
    const codeText = `Код: ${code}`
    const messageSum = allSumFact.value ? `прийняв ${allSumFact.value} грн (№ пакету ${allSumPack.value})` : ``
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

    // await appStore.sendSMScode({ phone: pointData.value.rcptPhone, message: translit })
}

const openMassReleaseDialog = () => {
    massReleaseDialog.value = true
    allSumFact.value = allSum.value
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
                palletsFact: curDoc.pallQty,
                boxesFact: curDoc.boxQty,
                sumFact: allSumFact.value,
                sumPack: allSumPack.value,
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
    return docs.value.filter((item) => item.docType == 'out').sort((a, b) => a.id - b.id)
})

const inData = computed(() => {
    return docs.value.filter((item) => item.docType == 'in').sort((a, b) => a.id - b.id)
})

const taskData = computed(() => {
    return docs.value.filter((item) => item.docType == 'task').sort((a, b) => a.id - b.id)
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
    return btnsRules.value && Object.keys(docsSelected.value).length
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
        if (docStatuses.value[item] && docStatuses.value[item].status == 200 && (docData.docType == 'out' || docData.docType == 'task')
            && completeAllSelectedTasks.value) {
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
        if (docData.boxQty) result += docData.boxQty
    }
    return result
})

// сума ПАЛЕТ усіх вибраних доументів
const allPallets = computed(() => {
    let result = 0
    for (let item of Object.keys(docsSelected.value)) {
        const docData = docs.value.find((doc) => doc.id == item)
        if (docData.pallQty) result += docData.pallQty
    }
    return result
})

// сума COD у всіх вибраних доументів
const allSum = computed(() => {
    let result = 0
    for (let item of Object.keys(docsSelected.value)) {
        const docData = docs.value.find((doc) => doc.id == item)
        if (docData.sum) result += docData.sum
    }
    return result
})

const checkSmsCode = computed(() => {
    return navigator.onLine ? md5(smsCode.value) == checkSmsHash.value : true
})

const isEditor = computed(() => {
    return trip.value.editorId == appStore.user_id
})

</script>