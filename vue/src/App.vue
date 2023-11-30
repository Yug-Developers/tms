<template>
    <div class="pa-10">
        <h1>Test TMS v{{ version }}</h1>
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <div class="container-fluid">
                <router-link class="navbar-brand pa-5" to="/">Home</router-link>
                <router-link class="navbar-brand pa-5" to="/dashboard">Dashboard</router-link>
                <router-link class="navbar-brand pa-5" to="/login">Login</router-link>
            </div>
        </nav>
        <router-view />
    </div>
</template>

<script setup>
import { ref } from 'vue'
const version = ref('0.0.0.7')
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