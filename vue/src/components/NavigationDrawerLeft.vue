<template>
    <v-navigation-drawer width="330" location="left" v-model="appStore.navigationDrawerLeftShow" temporary app>
        <v-toolbar  >
            <v-img height="30" position="center" contain src="/img/icons/logo_sun_n.png" />
        </v-toolbar>
        <v-card elevation="0">
            <v-card-text>
                <div>Вітаємо, <b>{{ appStore.userData.pib }}</b>!</div>
                <div>тел.: {{ appStore.userData.phone }}</div>
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
            <v-card-actions>
                <v-spacer></v-spacer>
                <div class="caption">Version: {{ version }}</div>
                <v-spacer></v-spacer>
            </v-card-actions>
        </v-card>
    </v-navigation-drawer>
    <v-dialog scrim="red" v-model="logoutDialog" width="300">
        <v-card class="d-flex align-center justify-center flex-wrap text-center mx-auto px-4">
            <v-card-title>Вихід з системи</v-card-title>
            <v-card-text>
                <h2 class="text-h4 font-weight-black text-orange">Увага!</h2>
                <div class="text-h5 font-weight-medium mb-2">Ви впевнені, що хочете вийти з системи?</div>
                <p class="text-body-2 mb-4">В випадку виходу з системи усі локальні данні користувача будут видалені.</p>
                </v-card-text>
            <v-card-actions>
                <v-btn color="primary" @click="logoutDialog = false">Ні</v-btn>
                <v-btn color="grey" @click="logout()">Так</v-btn>
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
const version = process.env.__VERSION__
</script>
  