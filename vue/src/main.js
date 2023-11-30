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


// Plugins
import { registerPlugins } from '@/plugins'

const app = createApp(App).use(VueReCaptcha, { siteKey: '6LfBkcgUAAAAAKBXOgiOMftenYqJ45A5bE_JJHJl'})

// app.config.errorHandler = function(err, vm, info) {
//     console.log(`Error: ${err.toString()}\nInfo: ${info}`);
// }
  
registerPlugins(app)

app.mount('#app')
