import { createApp } from 'vue'
import App from './App.vue'
import VTooltip from 'v-tooltip';
import Vuetify from 'vuetify'
import 'vuetify/styles'

const app = createApp(App)

app.use(Vuetify)
app.use(VTooltip);
app.mount('#app')
