<template>
<v-app>
    <MainNavigation />
    <v-main>
        <v-layout full-height class="align-center">
            <v-row justify="center">
                <v-col cols="11">
                    <v-card elevation="0" max-width="400" class="mx-auto">
                        <v-icon class="mx-4 text-primary" size="x-large">mdi-weather-cloudy-alert</v-icon>
                        <v-card-text class="text-primary py-0">Помилка 404</v-card-text>
                        <v-card-title class="py-4">Сторінку не знайдено!</v-card-title>
                        <v-card-text>Неправильно набрано адресу або такої сторінки на сайті не існує</v-card-text>
                        <v-card-text>Перейдіть на головну сторінку або оберіть потрібний розділ</v-card-text>
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