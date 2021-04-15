import { ElButton, ElSwitch, ElInput } from 'element-plus';
import { createApp } from 'vue';
import 'element-plus/lib/theme-chalk/index.css';
import App from './App.vue';

const app = createApp(App);
app.component(ElButton);
app.component(ElSwitch);
app.component(ElInput);
app.mount('#app');
