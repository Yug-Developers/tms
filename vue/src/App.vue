<template>
    <v-app>
        <v-main>
           <router-view />
        </v-main>
    </v-app>
    <SnackBar />
</template>

<script setup>
import SnackBar from './components/SnackBar.vue'
import { useAppStore } from './store/appStore';
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