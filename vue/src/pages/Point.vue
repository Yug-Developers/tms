<template>
    <MainNavigation />
    <v-layout full-height>
        <template v-if="trip && pointData && pointData.id">
            <v-container>
                <PointHeader :point="pointData" :tripId="tripId" :points="points" :editorId="isEditor" />
                <v-sheet v-if="pointData.pointType != 'wh'" elevation="0" max-width="600" width="100%" class="mx-auto">
                    <template v-for="(type) in types" :key="type">
                        <v-expansion-panels v-model="panel[type]" multiple class="mb-2">
                            <v-expansion-panel v-if="docsData[type].length != 0">
                                <v-expansion-panel-title disable-icon-rotate>
                                    <div class="text-subtitle">{{ typesObj[type] }}
                                        <v-badge color="info" :content="docsData[type].length" inline></v-badge>
                                    </div>
                                </v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <template v-if="docsData[type].length">
                                        <div class="pb-5 d-flex justify-space-between"
                                            v-if="pointStatus == 200 && allDocsCompleteByType[type]"
                                            @click="selectAllDocs(type)">
                                            <v-btn text size="small" variant="tonal"
                                                :color="selectAll[type] ? `primary` : `green`"
                                                :prepend-icon="selectAll[type] ? `mdi-close` : `mdi-check`">
                                                <span v-if="selectAll[type]" class="text-caption">Очистити всі</span>
                                                <span v-else class="text-caption">Вибрати всі</span>
                                            </v-btn>
                                        </div>
                                        <div class="text-left pa-0" flat v-for="doc in docsData[type]" :key="doc.id"
                                            :style="isEditor ? `cursor: pointer` : ``" :elevation="1"
                                            @click="selectDoc(doc.id)"
                                            :class="docsSelected[doc.id] ? `bg-teal-lighten-5` : ``">
                                            <div class="d-flex justify-space-between">
                                                <div>
                                                    <v-icon
                                                        v-if="pointStatus == 200 && docStatuses[doc.id] && docStatuses[doc.id].status == 200"
                                                        :icon="docsSelected[doc.id] ? `mdi-check-circle-outline` : `mdi-circle-outline`"
                                                        color="green" class="mr-2 mb-1" />
                                                    <b v-if="doc.mainDocumentId">{{ doc.mainDocumentId }}</b>
                                                    <span v-if="doc.id != doc.mainDocumentId"> ({{ doc.id }})</span>
                                                    <span v-if="doc.docType == 'out_RP'"> (з РП)</span>
                                                </div>
                                                <div class="d-flex flex-column">
                                                    <StatusChip :tripId="tripId" :pointId="pointId" :docId="doc.id" />
                                                    <span
                                                        v-if="docStatuses[doc.id] && docStatuses[doc.id].status == 300"
                                                        :class="`text-center text-caption ${docStatuses[doc.id].statusConnection ? 'text-success' : 'text-error'}`">{{
                                                            docStatuses[doc.id].statusConnection
                                                                ? 'online' : 'offline' }}</span>
                                                </div>
                                            </div>
                                            <div v-if="(doc.docType == 'out' || doc.docType == 'out_RP') && doc.taxNumber"
                                                class="text-caption">
                                                ВН {{ doc.taxNumber }}
                                            </div>
                                            <v-table density="compact"
                                                :class="`details my-2 text-center ` + (docsSelected[doc.id] ? `bg-teal-lighten-5` : ``)">
                                                <thead>
                                                    <tr>
                                                        <th v-if="doc.docType != 'task'" class="text-center">
                                                            Вага, кг
                                                        </th>
                                                        <th v-if="doc.docType != 'task'" class="text-center">
                                                            Об'єм, м3
                                                        </th>
                                                        <th v-if="doc.docType == 'out' || doc.docType == 'out_RP'"
                                                            class="text-center">
                                                            Місць
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td v-if="doc.docType != 'task'">{{ doc.weight }}</td>
                                                        <td v-if="doc.docType != 'task'">{{ doc.volume }}</td>
                                                        <td v-if="doc.docType == 'out' || doc.docType == 'out_RP'">
                                                            <span v-if="doc.boxQty">{{ doc.boxQty }}</span><span
                                                                v-if="!doc.boxQty">-</span> / <span
                                                                v-if="doc.pallQty">{{ doc.pallQty }}</span><span
                                                                v-if="!doc.pallQty">-</span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </v-table>
                                            <div v-if="doc.docType != 'in' && doc.sum"><v-icon size="small" color="grey"
                                                    class="mr-2">mdi-email-outline</v-icon>COD: {{ doc.sum }} </div>
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
                                                        <td colspan="2" class="px-0">
                                                            <v-card-actions
                                                                v-if="isEditor && docStatuses[doc.id] && docStatuses[doc.id].status == '200' && btnsRules"
                                                                class="mb-2 px-0 pt-0">
                                                                <v-btn icon="mdi-account-check-outline"
                                                                    @click="release(doc.id)" color="success"
                                                                    :disabled="docsSelected[doc.id]"></v-btn>
                                                                <v-spacer></v-spacer>
                                                                <v-btn icon="mdi-account-remove-outline"
                                                                    @click="reject(doc.id)" color="primary"
                                                                    :disabled="docsSelected[doc.id]">
                                                                </v-btn>
                                                                <v-spacer></v-spacer>
                                                                <v-btn icon="mdi-cancel" @click="cancel(doc.id)"
                                                                    color="primary" :disabled="docsSelected[doc.id]">
                                                                </v-btn>
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
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </template>
                </v-sheet>
            </v-container>
        </template>

        <template v-if="!trip">
            <v-container class="d-flex align-self-center">
                <v-card elevation="0" max-width="400" class="mx-auto">
                    <v-icon class="mx-4 text-primary" size="x-large">mdi-alert</v-icon>
                    <v-card-text class="text-primary py-0">Рейс не знайдено</v-card-text>
                    <v-card-text class="pt-4 font-weight-bold">Рейса {{ tripId }} не існує!</v-card-text>
                    <v-card-text>Неправильно вказано номер рейса або такого рейса не існує</v-card-text>
                    <v-card-text>Перейдіть на головну сторінку або оберіть потрібний розділ</v-card-text>
                </v-card>
            </v-container>
        </template>

        <template v-if="points.length && !pointData">
            <v-container class="d-flex align-self-center">
                <v-card elevation="0" max-width="400" class="mx-auto">
                    <v-icon class="mx-4 text-primary" size="x-large">mdi-alert</v-icon>
                    <v-card-text class="text-primary py-0">Точку доставки не знайдено</v-card-text>
                    <v-card-text class="pt-4 font-weight-bold">Точка {{ pointId }} не існує!</v-card-text>
                    <v-card-text>Неправильно вказано точку або такої точки доставки не існує</v-card-text>
                    <v-card-text>Перейдіть на головну сторінку або оберіть потрібний розділ</v-card-text>
                </v-card>
            </v-container>
        </template>
    </v-layout>
    <!-- <pre>{{ appStore.statuses.filter(el => el._id == tripId) }}</pre> -->
    <v-bottom-navigation :active="bottomNavigation" v-model="bottomModel" elevation="24" height="80">
        <v-btn :disabled="releaseBottomBtn" @click="openMassReleaseDialog()" stacked
            prepend-icon="mdi-account-check-outline" class="text-subtitle-2 mx-2">
            <template v-slot:prepend>
                <v-icon color="success"></v-icon>
            </template>
            Видано
        </v-btn>
        <v-btn :disabled="rejectBottomBtn" @click="massRejectDialog = true" stacked
            prepend-icon="mdi-account-remove-outline" class="text-subtitle-2 mx-2">
            <template v-slot:prepend>
                <v-icon color="primary"></v-icon>
            </template>
            Відмова
        </v-btn>
        <v-btn :disabled="cancelBottomBtn" @click="massCancelDialog = true" stacked prepend-icon="mdi-cancel"
            class="text-subtitle-2 mx-2">
            <template v-slot:prepend>
                <v-icon color="primary"></v-icon>
            </template>
            Скасування
        </v-btn>
    </v-bottom-navigation>

    <v-dialog v-model="acceptDocDialog" max-width="600" persistent>
        <v-card>
            <v-card-title v-if="curDoc.docType == 'out' || curDoc.docType == 'out_RP'" class="mt-2">
                Видано по документу {{ curDoc.id }}:
            </v-card-title>
            <v-card-title v-if="curDoc.docType == 'in' || curDoc.docType == 'task'">
                Прийнято по документу {{ curDoc.id }}:
            </v-card-title>
            <v-form v-model="isFormValid">
                <v-card-text v-if="curDoc.docType == 'out' || curDoc.docType == 'out_RP' || curDoc.docType == 'in'"
                    class="pb-0">
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
                <v-card-text v-if="curDoc.sum" class="pt-0">
                    <v-icon size="small" color="grey" class="mr-2">mdi-email-outline</v-icon>Прийнято COD:
                    <v-row class="mt-2">
                        <v-col>
                            <v-text-field v-model="sumPack" label="Пакет №" :rules="[rules.isNotEmpty]"
                                outlined append-icon="mdi-barcode" @click="openScanDialog"></v-text-field>
                        </v-col>

                        <v-col>
                            <v-text-field v-model="sumFact" label="Сума, грн" :rules="[rules.isNotEmpty, rules.number]"
                                outlined></v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-form>
            <v-card-actions>
                <v-btn color="grey" @click="cancelSmsDialog()">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="acceptRelease()" :disabled="isFormValid ? false : true"
                    :loading="loading">Підтвердити</v-btn>
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
                <v-btn :disabled="rejectText ? false : true" @click="rejectDoc()" :loading="loading">Підтвердити</v-btn>
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
                <v-btn :disabled="cancelText ? false : true" :loading="loading" @click="cancelDoc()">Підтвердити</v-btn>
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
                <v-btn color="grey" @click="massRejectDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="rejectText ? false : true" @click="massReject()"
                    :loading="loading">Підтвердити</v-btn>
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
                <v-btn color="grey" @click="massCancelDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn :disabled="cancelText ? false : true" @click="massCancel()"
                    :loading="loading">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="massReleaseDialog" max-width="600">
        <v-card>
            <v-card-title class="mt-2">
                Видано по вибраним документам
            </v-card-title>
            <v-form v-model="isFormValid">
                <v-card-text v-if="allBoxes || allPallets" class="pb-2 px-4">
                    <v-row>
                        <v-col>
                            <v-text-field v-model="allBoxes" :rules="[rules.number]" readonly label="Коробок"
                                outlined></v-text-field>
                        </v-col>
                        <v-col>
                            <v-text-field v-model="allPallets" :rules="[rules.number]" readonly label="Палет"
                                outlined></v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-text v-if="allSum" class="pt-0 px-4">
                    <v-icon size="small" color="grey" class="mr-2">mdi-email-outline</v-icon>Прийнято COD:
                    <v-row class="mt-2">
                        <v-col>
                            <v-text-field v-model="allSumPack" :rules="[rules.isNotEmpty]" label="Пакет №"
                                outlined append-icon="mdi-barcode" @click="openScanDialog('all')"></v-text-field>
                        </v-col>
                        <v-col>
                            <v-text-field v-model="allSumFact" :rules="[rules.isNotEmpty, rules.number]"
                                label="Сума, грн" outlined></v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="grey" @click="massReleaseDialog = false">Скасувати</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn :disabled="isFormValid ? false : true" @click="acceptMassRelease()"
                        :loading="loading">Підтвердити</v-btn>
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>

    <v-dialog v-model="acceptSmsDialog" max-width="600" persistent>
        <v-card>
            <v-card-title>
                Підтвердження
            </v-card-title>
            <v-card-text v-if="statusConnection" class="px-2">
                <div class="mb-4 px-2">Одержувачу на тел. було надіслано SMS з Кодом підтвердження.</div>
                <div class="text-center">
                    <v-text-field label="Код з SMS" v-model="smsCode" style="width: 120px" outlined
                        class="mx-auto"></v-text-field>
                    <v-progress-circular v-if="timer !== 0" :model-value="timer" :rotate="360" :size="50" :width="5"
                        color="teal">
                        {{ timer / 100 * 60 }}
                    </v-progress-circular>
                </div>
                <div class="text-center">
                    <v-btn v-if="timer === 0" @click="sendSMS()">Відправити SMS повторно</v-btn>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-btn color="grey" @click="acceptSmsDialog = false">Скасувати</v-btn>
                <v-spacer></v-spacer>
                <v-btn v-if="timer != 0" @click="accept()" :loading="loading">Підтвердити</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <v-dialog v-model="isDialogOpen" max-width="600">
      <v-card>
        <v-card-title>Відскануйте штрих-код</v-card-title>
        <v-card-text>
          <div
            ref="scannerContainer"
            style="width: 100%; height: 300px; background-color: #000"
          ></div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="red" text @click="closeDialog">Закрити</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
import PointHeader from '@/components/PointHeader.vue'
import StatusChip from '@/components/DocumentStatusChip.vue'
import { onMounted, onBeforeUnmount, ref, computed, reactive, watch, nextTick  } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/appStore'
import cyrillicToTranslit from 'cyrillic-to-translit-js'
import md5 from 'md5'
import Quagga from 'quagga'

const appStore = useAppStore()
const route = useRoute()
const pointData = ref({})
const points = ref([])
const docs = ref([])
const panel = ref({})
const types = ['out', 'in', 'task']
const typesObj = {
    out: 'Видачі',
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
const selectAll = reactive({})
const loading = ref(false)
const isDialogOpen = ref(false)
const scannerContainer = ref(null)

// Функція для ініціалізації Quagga
const startScanner = () => {
  if (!scannerContainer.value) {
    console.error('Сканер контейнер ще не готовий')
    return
  }

  Quagga.init(
    {
      inputStream: {
        type: 'LiveStream',
        target: scannerContainer.value, // Елемент для відображення камери
        constraints: {
          facingMode: 'environment', // Використовує задню камеру
        },
      },
      decoder: {
        readers: ['code_128_reader', 'ean_reader', 'upc_reader'], // Налаштування форматів
      },
    },
    (err) => {
      if (err) {
        console.error('Помилка ініціалізації Quagga:', err)
        return
      }
      Quagga.start()
    }
  )

  // Підписка на подію розпізнавання штрих-коду
  Quagga.onDetected((result) => {
    sumPack.value = result.codeResult.code
    allSumPack.value = result.codeResult.code
    closeDialog()
  })
}

// Зупинка сканера та очищення
const stopScanner = () => {
  Quagga.stop()
  Quagga.offDetected()
}

// Відкрити попап
const openScanDialog = () => {
  isDialogOpen.value = true
}

// Закрити попап і зупинити сканер
const closeDialog = () => {
  isDialogOpen.value = false
  stopScanner()
}

// Слідкуємо за станом попапу
watch(isDialogOpen, (isOpen) => {
  if (isOpen) {
    // Переконуємося, що DOM оновлений перед запуском сканера
    nextTick(() => startScanner())
  } else {
    stopScanner()
  }
})

// Очистити все при виході з компонента
onBeforeUnmount(() => {
  stopScanner()
})

onMounted(async () => {
    try{
        await appStore.pullTripsData()
        trip.value = await appStore.getTripDoc(tripId.value)
        //Поточні данні документу рейсу
        if (trip.value && trip.value.points) {
            //точки документу рейсу
            if (trip.value.isCircular) {
                const firstPointCopy = { ...trip.value.points[0], id: -1, status: 100, sortNumber: trip.value.points.length + 1 }
                trip.value.points = [...trip.value.points, firstPointCopy]
            }
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
    number: v => (v === 0 || (v && !isNaN(v) && !/\s+/.test(v))) || 'Тільки цифри',
    isNotEmpty: v => !!v || 'Поле не може бути порожнім'
}


const selectDoc = (id) => {
    if (!isEditor.value || pointStatus.value !== 200) return
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
        curPallets.value = Number(curDocument.pallQty)
        curBoxes.value = Number(curDocument.boxQty)
        sumPack.value = curDocument.sumPack
        sumFact.value = Number(curDocument.sum)
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
    smsCode.value = ''
    const [code, hash] = await appStore.createCode()
    checkSmsHash.value = hash
    const message = curDoc.value.docType == 'out' || curDoc.value.docType == 'out_RP' ?
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
    smsCode.value = ''
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
            loading.value = true
            await appStore.releaseDoc({
                tripId: tripId.value,
                pointId: pointId.value,
                docId: Number(curDoc.value.id),
                sumPack: Number(sumPack.value),
                sumFact: Number(sumFact.value),
                palletsFact: Number(curPallets.value),
                boxesFact: Number(curBoxes.value)
            })
            loading.value = false
            acceptSmsDialog.value = false
            acceptDocDialog.value = false
            appStore.setSnackbar({ text: "Документ отримано", type: 'success' })
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
        loading.value = true
        await appStore.rejectDoc({
            tripId: tripId.value,
            pointId: pointId.value,
            docId: curDoc.value.id,
            description: rejectText.value
        })
        loading.value = false
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
        loading.value = true
        await appStore.cancelDoc({
            tripId: tripId.value,
            pointId: pointId.value,
            docId: curDoc.value.id,
            description: cancelText.value
        })
        loading.value = false
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
        if (checkSmsCode.value) {
            loading.value = true
            for (let docId of Object.keys(docsSelected.value)) {
                const curDoc = docs.value.find((item) => item.id == docId)
                const sumDoc = docs.value.find((item) => item.sum > 0) || {}
                await appStore.releaseDoc({
                    tripId: tripId.value,
                    pointId: pointId.value,
                    docId: Number(docId),
                    palletsFact: Number(curDoc.pallQty),
                    boxesFact: Number(curDoc.boxQty),
                    sumFact: sumDoc.id == docId ? Number(allSumFact.value) : 0,
                    sumPack: sumDoc.id == docId ? allSumPack.value : 0,
                    statusConnection: navigator.onLine
                })
            }
            loading.value = false
            docsSelected.value = {}
            massReleaseDialog.value = false
            acceptSmsDialog.value = false
        } else {
            appStore.setSnackbar({ text: "Невірний код з SMS", type: 'error' })
        }
    } catch (error) {
        console.error(error)
    }
}

const massReject = async () => {
    try {
        loading.value = true
        for (let docId of Object.keys(docsSelected.value)) {
            await appStore.rejectDoc({
                tripId: tripId.value,
                pointId: pointId.value,
                docId: Number(docId),
                description: rejectText.value
            })
        }
        loading.value = false
        docsSelected.value = {}
        massRejectDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const massCancel = async () => {
    try {
        loading.value = true
        for (let docId of Object.keys(docsSelected.value)) {
            await appStore.cancelDoc({
                tripId: tripId.value,
                pointId: pointId.value,
                docId: Number(docId),
                description: cancelText.value
            })
        }
        loading.value = false
        docsSelected.value = {}
        massCancelDialog.value = false
    } catch (error) {
        console.error(error)
    }
}

const selectAllDocs = (type) => {
    if (selectAll[type]) {
        docsSelected.value = {}
        selectAll[type] = false
        if (type == 'out') {
            selectAll['out_RP'] = false
        }
    } else {
        docs.value.forEach((item) => {
            if (pointStatus.value == 200 && docStatuses.value[item.id] && docStatuses.value[item.id].status == 200) {
                if (item.docType == type) {
                    docsSelected.value[item.id] = true
                }
                if (type == 'out') {
                    if (item.docType == 'out_RP') {
                        docsSelected.value[item.id] = true
                    }
                }
            }
        })
        selectAll[type] = true
        if (type == 'out') {
            selectAll['out_RP'] = true
        }
    }
}

const statuses = computed(() => {
    return appStore.statuses.find((item) => item._id == tripId.value)
})

const outData = computed(() => {
    return docs.value.filter((item) => item.docType == 'out' || item.docType == 'out_RP').sort((a, b) => a.id - b.id)
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
    return btnsRules.value && Object.keys(docsSelected.value).length ? true : false
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
        if (docStatuses.value[item] && docStatuses.value[item].status == 200 && (docData.docType == 'out' || docData.docType == 'out_RP' || docData.docType == 'task')
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
    return trip.value.editorId == appStore.localStg.user_id
})

const allDocsCompleteByType = computed(() => {
    // хоч один має статус 200
    return {
        out: outData.value.find((item) => docStatuses.value[item.id] && docStatuses.value[item.id].status == 200),
        in: inData.value.find((item) => docStatuses.value[item.id] && docStatuses.value[item.id].status == 200),
        task: taskData.value.find((item) => docStatuses.value[item.id] && docStatuses.value[item.id].status == 200)
    }

})

</script>

<style scoped>
.v-expansion-panel-title {
    padding: 16px;
    min-height: inherit !important;
}

.v-expansion-panel-title.v-expansion-panel-title--active {
    border-bottom: 1px solid #e3e1e1 !important;
    margin-bottom: 16px !important;
}

.v-table.details th:not(:last-child),
.v-table.details td:not(:last-child) {
    border-right: 1px solid #e3e1e1 !important;
}

.v-expansion-panel-text .v-expansion-panel-text__wrapper {
    padding: 16px !important;
}
</style>