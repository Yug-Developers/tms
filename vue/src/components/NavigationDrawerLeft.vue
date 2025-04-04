<template>
    <v-navigation-drawer width="330" location="left" v-model="appStore.navigationDrawerLeftShow" temporary app>
        <v-toolbar class="pl-4 font-weight-bold mb-4">
            <!-- <v-img height="30" position="center" contain src="/img/icons/logo_sun_n.png" /> -->
            ЮК.Доставка
        </v-toolbar>
        <v-card elevation="0">
            <v-card-subtitle>Вітаємо,</v-card-subtitle>
                        <v-card-title class="font-weight-bold text-body2">{{ appStore.localStg.userData && appStore.localStg.userData.pib }}!</v-card-title>
                        <v-card-text class="mt-2"><v-icon icon="mdi-phone" color="grey"></v-icon>
                            {{ appStore.localStg.userData && appStore.localStg.userData.phone }}
            </v-card-text>
            <v-card-text>
                <v-list>
                    <v-list-item @click="appStore.navigationDrawerLeftShow = false" v-for="item in appStore.menuItems" :key="item.title" :to="item.to" link>
                        <template v-slot:prepend>
                            <v-icon :icon="item.icon"></v-icon>
                        </template>
                        <v-list-item-title v-text="item.title"></v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn @click="logoutDialog = true">
                    <v-icon>mdi-logout</v-icon> Вихід
                </v-btn>
            </v-card-actions>
            <v-card-text>
                <v-divider class="mb-4"></v-divider>
                <div class="text-caption text-center">version: {{ version }}</div>
                <div class="text-caption text-center">type: {{ type }}</div>
            </v-card-text>
        </v-card>
    </v-navigation-drawer>
    <v-dialog scrim="grey" v-model="logoutDialog" max-width="600">
        <v-card class="d-flex align-center justify-center flex-wrap text-center mx-auto pa-4">
            <v-card-title class="text-h5 font-weight-black text-primary"><v-icon icon="mdi-alert" color="primary" class="mr-2"></v-icon>Увага!</v-card-title>
                <v-card-text class="text-h6 font-weight-medium mb-2">Ви впевнені, що хочете вийти з системи?</v-card-text>
                <v-card-text class="text-body-2 mb-4" v-if="!appStore.online">Якщо ви працювали off-line і не підключалися до інтернету, то усі непередані дані при виході будут видалені.</v-card-text>
            <v-card-actions>
                <v-btn color="primary" @click="logoutDialog = false">Скасувати</v-btn>
                <v-btn color="grey" @click="logout()">Вийти</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
    
<script setup>
import { useAppStore } from '../store/appStore'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const logoutDialog = ref(false)
const appStore = useAppStore()

const logout = () => {
    logoutDialog.value = false
    appStore.logout()
        .then(() => {
            appStore.setSnackbar({ text: "Вы вышли из системы", type: 'success' });
            router.push('/login')
        })
        .catch((err) => {
            appStore.setSnackbar({ text: "Ошибка выхода из системы", type: 'error' });
            console.error(err);
        })

}
const version = process.env.__VERSION__ + ' ' + process.env.NODE_ENV
const type = appStore.localStg.userData.role
</script>
  