<script setup>
import { computed, ref } from "vue"
import { useRoute } from "vue-router"
import { useStore } from "vuex"
import SidenavItem from "./SidenavItem.vue"
import { auth } from "@/firebaseClient";

const store = useStore()

const isRTL = computed(() => store.state.isRTL)
const members = ref([]);
const user = computed(() => auth.currentUser)

const getRoute = () => {
  const route = useRoute()
  const routeArr = route.path.split("/")
  return routeArr[1] + (routeArr[2] ? `/${routeArr[2]}` : "")
}

// members will be populated once the database is connected

</script>


<template>
  <div class="collapse navbar-collapse w-auto h-auto h-100" id="sidenav-collapse-main">
    <ul class="navbar-nav">

      <!-- Dynamic member links -->
      <li class="nav-item" v-for="member in members" :key="member.music_id">
        <sidenav-item :to="`/members/${member.music_id}/tables`"
          :navText="member.member_id === user?.uid ? `${member.member_name} (You)` : member.member_name"
          :path="member.themes?.image" :background="member.themes?.light_one" :text="member.themes?.dark_one"
          :class="getRoute() === `members/${member.music_id}/tables` ? 'active' : ''" />
      </li>

      <!-- Settings link -->
      <li class="nav-item">
        <sidenav-item to="/profile" color="white" :text="'black'"
          :class="getRoute() === 'profile' ? 'active' : ''" :navText="isRTL ? 'حساب تعريفي' : 'Edit Settings'">
          <template #icon>
            <i class="ni ni-single-02 text-dark text-sm opacity-10"></i>
          </template>
        </sidenav-item>
      </li>

    </ul>
  </div>
</template>
