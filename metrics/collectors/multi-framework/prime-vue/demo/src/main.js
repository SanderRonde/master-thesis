import { createApp } from 'vue';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Input from 'primevue/inputtext';
const app = createApp(App);

app.use(PrimeVue);

app.component('Button', Button);
app.component('Checkbox', Checkbox);
app.component('Input', Input);

app.mount('#app');