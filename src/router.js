import Vue from "vue";
import VueRouter from "vue-router";
import AppHeader from "./layout/AppHeader.vue";
import LoginScreen from "./views/LoginScreen.vue";
import DashboardScreen from "./views/DashboardScreen.vue";
import EditProfileScreen from "./views/EditProfileScreen.vue";
import ProfileScreen from "./views/ProfileScreen.vue";
import NewRecordScreen from "./views/NewRecord.vue";
import NotFound from "./views/NotFound.vue";
import DisplayRecord from "./views/DisplayRecord.vue";
import DoctorLoginScreen from "./views/doctor/DoctorLoginScreen.vue";
import DoctorDashboardScreen from "./views/doctor/DoctorDashboardScreen.vue";
import HandleConnectionDoctor from "./views/doctor/HandleConnection.vue";
import HandleConnection from "./views/HandleConnection.vue";
import SessionScreen from "./views/SessionScreen.vue";
import DisplayPatientRecord from "./views/doctor/DisplayPatientRecord.vue";
import DoctorSessionScreen from "./views/doctor/DoctorSessionScreen.vue";
import NewPatientRecord from "./views/doctor/NewPatientRecord.vue";
import EditDoctorProfileScreen from "./views/doctor/EditDoctorProfileScreen.vue";
import DoctorProfileScreen from "./views/doctor/DoctorProfileScreen.vue";

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
    path: "/record/:id",
    name: "DisplayRecord",
    components: { default: DisplayRecord, header: AppHeader },
  },
  {
    path: "/connect",
    name: "ConnectScreen",
    components: {
      default: HandleConnection,
    },
  },
  {
    path: "/doctor",
    name: "DoctorLogin",
    components: {
      default: DoctorLoginScreen,
    },
  },
  {
    path: "/doctor/dashboard",
    name: "DoctorDashboard",
    components: {
      default: DoctorDashboardScreen,
    },
  },
  {
    path: "/doctor/connect",
    name: "ConnectScreen",
    components: {
      default: HandleConnectionDoctor,
    },
  },
  {
    path: "/session",
    name: "SessionScreen",
    components: {
      default: SessionScreen,
    },
  },
  {
    path: "/doctor/session",
    name: "DoctorSessionScreen",
    components: {
      default: DoctorSessionScreen,
    },
  },
  {
    path: "/doctor/view-record",
    name: "DisplayPatientRecord",
    components: {
      default: DisplayPatientRecord,
    },
  },
  {
    path: "/doctor/new-record",
    name: "NewPatientRecord",
    components: {
      default: NewPatientRecord,
    },
  },
  {
    path: "/doctor/profile",
    name: "DoctorProfileScreen",
    components: {
      default: DoctorProfileScreen,
    },
  },
  {
    path: "/doctor/edit-profile",
    name: "EditDoctorProfileScreen",
    components: {
      default: EditDoctorProfileScreen,
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
