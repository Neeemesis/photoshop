import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import VTooltip from 'v-tooltip';
import { createVuetify } from 'vuetify'
import 'vuetify/styles'

// Настройка feature flags для Vue
window.__VUE_PROD_HYDRATION_MISMATCH_DETAILS__ = false
window.__VUE_PROD_DEVTOOLS__ = false

const app = createApp(App)
const pinia = createPinia()
const vuetify = createVuetify()

app.use(pinia)
app.use(vuetify)
app.use(VTooltip)
app.mount('#app')
