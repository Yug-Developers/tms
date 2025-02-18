<template>
    <v-layout full-height class="align-center">
        <v-row>
            <v-col cols="11" class="mx-auto">
                <v-card class="elevation-12 mx-auto" max-width="600">
                    <v-toolbar color="header" class="px-4">
                        <!-- <v-img height="30" position="left center" contain src="/img/icons/logo_sun_n_sm.png" /> -->
                        TMS.Доставки <span class="font-italic ml-2 text-caption">(v.{{ version }})</span>
                        <v-spacer></v-spacer>
                        <v-icon color="grey">mdi-key</v-icon>
                    </v-toolbar>
                    <v-card flat rounded="0" :loading="appStore.loading ? 'error' : false">
                        <v-card-text v-if="appStore.offline" class="text-center py-4 bg-red-lighten-5">
                            <v-icon color="error" class="pa-5">mdi-wifi-off</v-icon>
                            <span class="text-error">Ви не підключені до мережі Інтернет</span>
                        </v-card-text>
                        <v-card-text>
                            <v-text-field @keyup.enter="login()" prepend-icon="mdi-account" variant="underlined"
                                v-model="USER" name="login" label="Логін" type="text" append-icon="mdi"
                                density="default"></v-text-field>
                            <v-text-field @keyup.enter="login()" prepend-icon="mdi-lock" variant="underlined"
                                v-model="PASS" name="password" label="Пароль" :type="showPassword ? 'text' : 'password'"
                                density="default" :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                                @click:append="showPassword = !showPassword">
                            </v-text-field>

                        </v-card-text>
                        <v-card-actions class="pa-4">
                            <v-btn color="grey" density="default" @click="resetData()">Очистити</v-btn>
                            <v-spacer></v-spacer>
                            <v-btn density="default" :disabled="USER && PASS ? false : true" @click="Login()"
                                :loading="loading" variant="elevated">Увійти</v-btn>
                        </v-card-actions>
                    </v-card>
                    <v-card-text class="text-center py-4 bg-grey-lighten-3"><router-link class="text-primary"
                            to="/forgot-password">Забув пароль?</router-link></v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-layout>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { ref, onMounted } from 'vue'
import { useOnlineStatus } from '@/hooks/onlineStatus'

const { updateOnlineStatus } = useOnlineStatus()
const version = process.env.__VERSION__
const appStore = useAppStore()
const USER = ref('')
const PASS = ref('')
const showPassword = ref(false)

const resetData = () => {
    USER.value = ''
    PASS.value = ''
}
const loading = ref(false)
const Login = async () => {
    try {
        loading.value = true
        await appStore.login(USER.value, PASS.value)
        appStore.user_name = USER.value
        appStore.setSnackbar({ text: "Вхід виконано успішно!", type: 'success' });
        setTimeout(() => {
            window.location.href = '/'
        }, 500)
        loading.value = false
    } catch (err) {
        if (err.status === 401) {
            appStore.setSnackbar({ text: "Некоректний логін чи пароль.", type: 'error' })
        } else if (err.status === 403) {
            appStore.setSnackbar({ text: "Вибачте, але ви не маєте доступу до цієї сторінки.", type: 'error' })
        } else {
            appStore.setSnackbar({ text: `Помилка сервера - ${err.status}. Спробуйте пізніше.`, type: 'error' })
        }
        console.error(err)
        loading.value = false
    }
}
onMounted(() => {
    appStore.skipSync = true
    updateOnlineStatus()
})
</script>