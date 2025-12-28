import { createApp } from "vue";
// import "./style.css";
import App from "./App.vue";
import { router } from "./router/index.ts";
import 'highlight.js/styles/atom-one-dark.css';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import hljsVuePlugin from "@highlightjs/vue-plugin";

// 註冊需要的語言，減少打包體積
hljs.registerLanguage('python', python);


createApp(App).use(router).use(hljsVuePlugin).mount("#app");