import Vue from "vue";
import App from "./App.vue";
Vue.config.productionTip = false;
import router from "./router";
import store from "./store";

import Buefy from "buefy";
import "buefy/dist/buefy.css";
Vue.use(Buefy);

import Vuesax from "vuesax";
import "vuesax/dist/vuesax.css"; //Vuesax styles
Vue.use(Vuesax);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
