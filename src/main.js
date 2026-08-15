import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";

import App from "./App.vue";
import AuthView from "./views/AuthView.vue";
import HomeView from "./views/HomeView.vue";
import "../styles.css";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomeView },
    { path: "/login", component: AuthView, props: { mode: "login" } },
    { path: "/register", component: AuthView, props: { mode: "register" } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

createApp(App).use(router).mount("#app");
