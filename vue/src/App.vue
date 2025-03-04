<template>
    <RecaptchaLoader v-if="!appStore.offline"/>
    <v-app>
        <v-main :class="appStore.offline ?`bg-red-lighten-5`:``">
           <router-view />
        </v-main>
    </v-app>
    <SnackBar />
</template>

<script setup>
import SnackBar from './components/SnackBar.vue'
import { useAppStore } from './store/appStore';
import RecaptchaLoader from './components/RecaptchaLoader.vue'
const appStore = useAppStore()

// setInterval(() => {
//     appStore.pullTripsData()
// }, 60000)

</script>

<style>
.grecaptcha-badge {
    visibility: hidden !important;
}

body {
    font-size: 0.9rem;
}

.navbar-brand {
    font-size: 1.2rem;
}
</style>