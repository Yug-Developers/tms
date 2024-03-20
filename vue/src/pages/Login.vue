<template>
    <div class="container-fluid">
        <v-layout full-height class="align-center pa-10">
            <v-row>
                <v-col cols="11" class="mx-auto">
                    <v-card class="elevation-12 mx-auto" max-width="600">
                        <v-toolbar color="header" class="px-4">
                            <v-img height="30" position="left center" contain src="/img/icons/logo_sun_n_sm.png" />
                            <v-spacer></v-spacer>
                            <v-icon color="grey">mdi-key</v-icon>
                        </v-toolbar>
                        <v-card flat rounded="0" :loading="appStore.loading ? 'error' : false">
                            <v-card-text class="py-4 pt-12 text-center">Вхід ТМС (v{{ version }}):</v-card-text>
                            <v-card-text>
                                <v-text-field @keyup.enter="login()" prepend-icon="mdi-account" variant="underlined"
                                    v-model="USER" name="login" label="Логін" type="text" append-icon="mdi"
                                    density="default"></v-text-field>
                                <v-text-field @keyup.enter="login()" prepend-icon="mdi-lock" variant="underlined"
                                    v-model="PASS" name="password" label="Пароль"
                                    :type="showPassword ? 'text' : 'password'" density="default"
                                    :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                                    @click:append="showPassword = !showPassword">
                                </v-text-field>

                            </v-card-text>
                            <v-card-actions class="pa-4">
                                <v-btn color="grey" density="default" @click="resetData()">Очистити</v-btn>
                                <v-spacer></v-spacer>
                                <v-btn density="default" :disabled="USER && PASS ? false : true" @click="Login()"
                                    :loading="appStore.loading" variant="elevated">Увійти</v-btn>
                            </v-card-actions>
                        </v-card>
                        <v-card-text class="text-center py-4 bg-grey-lighten-3"><router-link class="text-primary"
                                to="/forgot-password">Забув пароль?</router-link></v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-layout>
    </div>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { ref, } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const version = process.env.__VERSION__
const appStore = useAppStore()
const USER = ref('')
const PASS = ref('')
const showPassword = ref(false)
const resetData = () => {
    USER.value = ''
    PASS.value = ''
}
const Login = async () => {
    try {
        const response = await appStore.login(USER.value, PASS.value)
        appStore.user_name = USER.value
        appStore.setSnackbar({ text: "Вы успешно авторизованы", type: 'success' });
        setTimeout(() => {
            window.location.href = '/'
        }, 500)

    } catch (err) {
        appStore.setSnackbar({ text: "Некорректный логин/пароль", type: 'error' });
        console.error(err);
    }
}
</script>