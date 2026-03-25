import { createRouter, createWebHistory } from "vue-router";
import store from '@/store'
import { auth } from '@/firebaseClient'


import Tables from "../views/TablesView.vue";
import Profile from "../views/ProfileView.vue";
import Signup from "../views/SignUp.vue";
import Signin from "../views/SignIn.vue";
import ResetPassword from "../views/ResetPassword.vue";
import ArtistDetail from "../views/ArtistDetail.vue";
import ForbiddenView from "../views/ForbiddenView.vue";
import MemberAddCard from "../views/components/MemberAddCard.vue";

const routes = [
  {
    path: '/',
    name: 'RootRedirect',
    beforeEnter: async (to, from, next) => {
      await auth.authStateReady()
      const user = store.state.user || auth.currentUser
      if (user) {
        next('/profile')
      } else {
        next('/signin')
      }
    }
  },

  {
    path: "/create-member",
    name: "MemberAddCard",
    component: MemberAddCard,
  },
  {
    path: '/members/:memberId/tables',
    name: "Tables",
    component: Tables,
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
  },
  {
    path: "/signin",
    name: "Signin",
    component: Signin,
    meta: { hideNavbar: true }
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
  },
  {
    path: "/resetpassword",
    name: "ResetPassword",
    component: ResetPassword,
  },
  {
    path: '/artists/:memberId/:artistId',
    name: "ArtistDetail",
    component: ArtistDetail,
    props: true
  },
  {
    path: '/forbidden',
    name: "ForbiddenView",
    component: ForbiddenView,
  },
];

const router = createRouter({
  history: createWebHistory('/song-ranker/'),
  routes,
  linkActiveClass: "active",
});

export default router;
