import Vue from "vue";
import VueRouter from "vue-router";
import AppHeader from "./layout/AppHeader.vue";
import LoginScreen from "./views/LoginScreen.vue";
import DashboardScreen from "./views/DashboardScreen.vue";
import NotFound from "./views/NotFound.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/home",
    name: "Dashboard",
    components: {
      header: AppHeader,
      default: DashboardScreen,
    },
  },
  {
    path: "/",
    name: "Login",
    components: {
      default: LoginScreen,
    },
  },
  {
    path: "*",
    components: {
      default: NotFound,
    },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
