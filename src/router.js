import Vue from "vue";
import VueRouter from "vue-router";
import AppHeader from "./layout/AppHeader.vue";
import LoginScreen from "./views/LoginScreen.vue";
import DashboardScreen from "./views/DashboardScreen.vue";
import EditProfileScreen from "./views/EditProfileScreen.vue";
import ProfileScreen from "./views/ProfileScreen.vue";
import NewRecordScreen from "./views/NewRecord.vue";
import NotFound from "./views/NotFound.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/dashboard",
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
    path: "/profile",
    name: "Profile",
    components: { default: ProfileScreen, header: AppHeader },
  },
  {
    path: "/editprofile",
    name: "EditProfile",
    components: { default: EditProfileScreen, header: AppHeader },
  },
  {
    path: "/new-record",
    name: "NewRecord",
    components: { default: NewRecordScreen, header: AppHeader },
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
