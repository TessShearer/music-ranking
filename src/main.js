import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import "./assets/css/nucleo-icons.css";
import "./assets/css/nucleo-svg.css";
import "./assets/css/main.css";
import ArgonDashboard from "./argon-dashboard";

// Handle Firebase password reset redirect:
// Firebase sends reset links with ?mode=resetPassword&oobCode=... in the URL.
// Store the code and redirect to the reset page before mounting.
const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get("mode") === "resetPassword" && searchParams.get("oobCode")) {
  sessionStorage.setItem("resetOobCode", searchParams.get("oobCode"));
  history.replaceState(null, "", window.location.pathname);
  router.isReady().then(() => router.replace("/resetpassword"));
}

const appInstance = createApp(App);
appInstance.use(store);
appInstance.use(router);
appInstance.use(ArgonDashboard);
appInstance.mount("#app");
