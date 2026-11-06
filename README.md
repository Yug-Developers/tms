# Transport Managment System

Для API та Vue потрібен Node.js 24 (див. `.nvmrc`) і npm 11 або новіший.
Dockerfile для розробки та production використовують `node:24-bookworm`.
Залежності встановлюються окремо в `api` та `vue` командою `npm ci`.
Для API production: `npm ci --omit=dev`; PM2 зафіксований у lock-файлі.

Перевірки фронтенду (у каталозі `vue`): `npm test`, `npm run lint`,
`npm run build`. Автовиправлення ESLint: `npm run lint:fix`.

Vuetify оновлено до підтримуваної гілки 3.13.x. Перехід на 4.x потребує
окремої міграції стилів і сітки. Для PouchDB зафіксовано override `uuid`
на сумісну CommonJS-гілку 11.x із виправленням відомої вразливості.

Головна сторінка отримує компактні картки через MIS API
`/tms/get-trip-summaries`, паралельно зі статистикою та повною синхронізацією.
Після синхронізації використовує локальні повні документи; без інтернету
читає локальну базу. Компактні картки не записуються до PouchDB.

Індекси підготовлюються у проєкті MIS скриптом
`api/scripts/prepare-tms-trip-summaries.js` для відповідного середовища.
Список доступних рейсів для календаря використовує наявний
`tms_available_trips_v1` і зберігає обмеження за користувачем.

Перевірки першого показу, гонок запитів та офлайн-режиму:
`docker exec tms-vue-dev node --test tests/home-loading.test.cjs`.
