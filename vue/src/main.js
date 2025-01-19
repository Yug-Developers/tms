/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'


import { registerSW  } from 'virtual:pwa-register'

const updateSW = registerSW({
    onNeedRefresh() {},
})

// Plugins
import { registerPlugins } from '@/plugins'

const app = createApp(App) 

// app.config.errorHandler = function(err, vm, info) {
//     console.log(`Error: ${err.toString()}\nInfo: ${info}`);
// }
  
registerPlugins(app)

app.mount('#app')
