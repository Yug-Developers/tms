<template>
    <v-app>
        <MainNavigation />
        <v-main>
            <v-layout full-height class="align-center">
            <v-row justify="center">
                <v-col cols="11">
                    <v-card elevation="0" max-width="400" class="mx-auto">
                        <v-icon class="mx-4 text-primary" size="x-large">mdi-alert-octagon-outline</v-icon>
                        <v-card-text class="text-primary py-0">Помилка 403</v-card-text>
                            <v-card-title class="py-4">Доступ до цієї сторінки обмежено!</v-card-title>
                            <v-card-text>У Вас недостатньо прав для перегляду даної сторінки</v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-layout>
        </v-main>
    </v-app>
</template>

<script setup>
import MainNavigation from '@/components/MainNavigation.vue'
</script>