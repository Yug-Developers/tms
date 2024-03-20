<template>
    <v-snackbar v-model="snackbar.model" ripple="true" :color="snackbar.color" elevation="0" :timeout="snackbar.timeout">
        <v-alert :color="snackbar.color" :icon="snackbar.icon || 'mdi-alert'" class="body-2 ma-0 mb-1">
            {{ snackbar.text }}
        </v-alert>
    </v-snackbar>
</template>

<script setup>
import { useAppStore } from '../store/appStore'
const appStore = useAppStore()
const {snackbar} = appStore
</script>
