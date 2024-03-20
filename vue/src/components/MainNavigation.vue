<template>
    <NavigationDrawerLeft />

    <v-app-bar name="app-bar" extension-height="2" extended color="header">
        <v-app-bar-nav-icon @click.stop="appStore.navigationDrawerLeftShow = !appStore.navigationDrawerLeftShow" />
        <template v-slot:image>

        </template>
        <v-toolbar-title ><v-img title="Головна сторінка" @click="router.push('/')" style="cursor:pointer" height="30" position="left center" contain src="/img/icons/logo_sun_n_sm.png" />
        </v-toolbar-title>
        <span>
            <v-btn v-if="route.name != 'Home'" icon @click="goBack()"><v-icon>mdi-step-backward</v-icon></v-btn>
            {{ route.meta.title }}</span>

        <v-spacer></v-spacer>
        <v-avatar size="15" class="mr-5" :color="appStore.online ? 'success' : 'error'"></v-avatar>
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

const route = useRoute()
const router = useRouter()
const goBack = () => {
    router.go(-1)
}

const appStore = useAppStore()
useOnlineStatus()
</script>