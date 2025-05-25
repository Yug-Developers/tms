<template>
    <v-layout full-height class="align-center">
        <v-row>
            <v-col cols="11" class="mx-auto">
                <v-card class="elevation-12 mx-auto" max-width="600">
                    <v-toolbar color="header" class="px-4">
                        <!-- <v-img height="30" position="left center" contain src="/img/icons/logo_sun_n_sm.png" /> -->
                        ЮК.Доставка <span class="font-italic ml-2 text-caption">(v.{{ version }})</span>
                        <v-spacer></v-spacer>
                        <v-icon color="grey">mdi-account-question-outline</v-icon>
                    </v-toolbar>
                    <v-card flat rounded="0" :loading="appStore.loading ? 'error' : false">
                        <v-card-text class="py-4 pt-12 text-center font-weight-black">
                            Забув пароль?
                        </v-card-text>
                        <v-card-text v-if="check" class="text-center">
                            Введіть телефон реестрації, на який буде відправлено код підтвердження:
                        </v-card-text>
                        <v-card-text v-if="check" class="text-center">
                            <v-form ref="form" v-model="formValid" v-if="check">
                                <v-text-field @keyup.enter="checkPhone()" prepend-icon="mdi-phone" variant="underlined"
                                    v-model="phone" name="phone" label="Телефон" type="text" append-icon="mdi"
                                    :rules="[rules.phone]" placeholder="+38(000) 000 - 0000" v-maska:[options]
                                    density="default"></v-text-field>
                            </v-form>
                        </v-card-text>
                        <v-card-text v-if="!check">
                            На вказаний телефон було надіслано код підтвердження. Введіть його
                        </v-card-text>
                        <v-card-text v-if="!check" class="text-center">
                            <v-form ref="form">
                                <v-text-field @keyup.enter="resetPassword()" prepend-icon="mdi-key" variant="underlined"
                                    v-model="code" name="code" label="Код підтвердження" type="text" append-icon="mdi"
                                    placeholder="0000" density="default"></v-text-field>
                            </v-form>
                        </v-card-text>
                        <v-card-actions class="pa-4">
                            <!-- <v-btn color="grey" density="default" @click="resetData()">Очистити</v-btn> -->
                            <v-spacer></v-spacer>
                            <v-btn density="default" :disabled="formValid ? false : true"
                                @click="check ? checkPhone() : resetPassword()" :loading="appStore.loading"
                                variant="elevated">Відправити</v-btn>
                            <v-spacer></v-spacer>
                        </v-card-actions>
                    </v-card>
                    <!-- <v-card-text class="text-center py-4 bg-grey-lighten-3"><router-link class="text-primary"
                                to="/login">Форма входу</router-link></v-card-text> -->
                </v-card>
            </v-col>
        </v-row>
    </v-layout>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { ref, } from 'vue'
import { useRouter } from 'vue-router'
import { vMaska } from "maska"
import Config from '@/Config'

const options = { mask: '+38(###) ### - ####' }
const router = useRouter()
const version = process.env.__VERSION__
const appStore = useAppStore()
const phone = ref('')
const formValid = ref(false)
const check = ref(true)
const code = ref('')
const hash = ref('')

const reCAPTCHA = ref('')
const rules = {
    phone: v => v.length === 19 || 'Невірний формат телефону'
}
const resetData = () => {
    phone.value = ''
}
const checkPhone = async () => {
    try {
        await recaptcha()
        await appStore.checkRecaptcha(reCAPTCHA.value)
        const response = await appStore.checkPhone(phone.value)
        if (response.content && response.content.hash) {
            hash.value = response.content.hash

            check.value = false
        } else {
            appStore.setSnackbar({ text: "Невідома помилка", type: 'error' });
        }
    } catch (err) {
        const error = err.status == 404 ? 'Уведений телефон не знайдено.' : err.message
        appStore.setSnackbar({ text: error, type: 'error' });
        console.error(err.status);
    }
}
const resetPassword = async () => {
    try {
        await recaptcha()
        await appStore.checkRecaptcha(reCAPTCHA.value)
        const response = await appStore.resetPassword({ phone: phone.value, code: code.value, hash: hash.value })
        if (response) {
            appStore.setSnackbar({ text: "Пароль успішно змінено та відправлено на вказаний телефон", type: 'success' });
            setTimeout(() => {
                router.push('/login')
            }, 500)
        } else {
            appStore.setSnackbar({ text: "Невідома помилка", type: 'error' });
        }

    } catch (err) {
        const error = err.response && err.response.data && err.response.data.error && err.response.data.error.message ? err.response.data.error.message : err.message
        appStore.setSnackbar({ text: error, type: 'error' });
        console.error(err.response.data.error.message);
    }
}

const recaptcha = async () => {
    try {
        reCAPTCHA.value = await executeRecaptcha()
    } catch (error) {
        throw error
    }
}

const executeRecaptcha = () => {
  return new Promise((resolve, reject) => {
    if (typeof grecaptcha !== 'undefined') {
      grecaptcha.ready(() => {
        grecaptcha
          .execute(Config.recaptchaSiteKey, { action: 'forgot' })
          .then((generatedToken) => {
            console.log('Отримано токен reCAPTCHA:', generatedToken)
            resolve(generatedToken) // Передаємо токен у виклик `resolve`
          })
          .catch((error) => {
            console.error('Помилка reCAPTCHA:', error)
            reject(error) // Передаємо помилку
          })
      })
    } else {
      const error = 'Google reCAPTCHA не завантажений'
      console.error(error)
      reject(error)
    }
  })
}

</script>