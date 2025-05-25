<template>
    <NavigationDrawerLeft />

    <v-app-bar name="app-bar" extension-height="2" extended color="header">
        <v-app-bar-nav-icon @click.stop="appStore.navigationDrawerLeftShow = !appStore.navigationDrawerLeftShow" />
        <template v-slot:image>

        </template>
        <v-toolbar-title>
            <div class="d-none d-sm-block" @click="router.push('/')">
                ЮК.Доставка</div>
        </v-toolbar-title>

        <span v-if="route.name != 'Home'">
            <v-btn icon @click="goBack()"><v-icon>mdi-arrow-u-left-bottom</v-icon></v-btn>
        </span>
        <v-spacer></v-spacer>

        <!-- <span :color="appStore.offline ? 'error' : 'success'" v-if="online">{{ connection }}</span> -->
        <!-- <v-icon class="mr-5 ml-1" v-if="appStore.offline" color="warning">mdi-wifi-off</v-icon>
        <v-icon class="mr-5 ml-1" v-else color="success">mdi-wifi</v-icon> -->
        <v-btn icon @click="syncData()" :loading="appStore.syncLoading"
            v-if="!appStore.offline && appStore.localStg.userData.role == 'driver'" title="Передати дані">
            <v-icon>mdi-sync</v-icon>
        </v-btn>
        <v-avatar size="15" class="mr-5 ml-2" :color="appStore.offline ? 'error' : 'success'"
            :title="appStore.offline ? 'Ви зараз off-line' : 'Ви зараз on-line'"></v-avatar>
        <template v-slot:extension>
            <v-progress-linear v-if="appStore.loading" indeterminate color="error"></v-progress-linear>
        </template>
    </v-app-bar>
</template>

<script setup>
import { useAppStore } from '@/store/appStore'
import { useOnlineStatus } from '@/hooks/onlineStatus'
import NavigationDrawerLeft from './NavigationDrawerLeft.vue'
import { useRoute, useRouter } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
const route = useRoute()
const router = useRouter()
const goBack = () => {
    router.go(-1)
}
const appStore = useAppStore()

const connection = computed(() => {
    return appStore.connection
})

const online = computed(() => {
    return navigator.onLine
})

const syncData = async () => {
    try {
        appStore.syncLoading = true
        const statusRes = await appStore.pushStatusesData(true)
        await appStore.pullTripsData({ destroyDB: 'routes' })
        const docsCnt = statusRes?.content?.length || 0
        appStore.setSnackbar({ text: `Обмін даними проведено успішно. Передано документів: ${docsCnt}`, type: 'success' })
    } catch (error) {
        console.error('Error pushing data:', error)
        appStore.setSnackbar({ text: "Під час обміну виникла помилка " + error.message, type: 'error' })
    } finally {
        appStore.syncLoading = false
    }
}


useOnlineStatus()
</script>