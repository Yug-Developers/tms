/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'
import { VueReCaptcha } from 'vue-recaptcha-v3'

import { registerSW  } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {},
})

// Plugins
import { registerPlugins } from '@/plugins'

const app = createApp(App).use(VueReCaptcha, { siteKey: '6Lc7Q78pAAAAAHE5WkV0Ug7N1OBeEi-YcageJfYa'})

// app.config.errorHandler = function(err, vm, info) {
//     console.log(`Error: ${err.toString()}\nInfo: ${info}`);
// }
  
registerPlugins(app)

app.mount('#app')
