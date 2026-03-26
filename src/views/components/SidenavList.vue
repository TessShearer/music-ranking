<script setup>
import { computed, ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { useStore } from "vuex"
import SidenavItem from "./SidenavItem.vue"
import { auth, db } from "@/firebaseClient";
import { collection, getDocs } from "firebase/firestore";
import { getTheme } from "@/themes";

const store = useStore()

const members = ref([]);
const user = computed(() => auth.currentUser)

const getRoute = () => {
  const route = useRoute()
  const routeArr = route.path.split("/")
  return routeArr[1] + (routeArr[2] ? `/${routeArr[2]}` : "")
}

onMounted(async () => {
  const snap = await getDocs(collection(db, 'members'));
  members.value = snap.docs.map(d => ({
    uid: d.id,
    ...d.data(),
    theme: getTheme(d.data().theme_id ?? 0),
  }));
});

// When the current user's member data changes in the store (e.g. theme update),
// sync the updated entry into the local members list
const storeMember = computed(() => store.state.member)
watch(storeMember, (updated) => {
  if (!updated || !auth.currentUser) return;
  const idx = members.value.findIndex(m => m.uid === auth.currentUser.uid);
  if (idx !== -1) {
    members.value[idx] = { ...members.value[idx], ...updated, theme: getTheme(updated.theme_id ?? 0) };
  }
});

</script>


<template>
  <div class="w-100 h-100">
    <ul class="navbar-nav">

      <!-- Dynamic member links -->
      <li class="nav-item" v-for="member in members" :key="member.uid">
        <sidenav-item :to="`/members/${member.uid}/tables`"
          :navText="member.uid === user?.uid ? `${member.member_name} (You)` : member.member_name"
          :path="member.theme?.image" :background="member.theme?.light_one" :text="member.theme?.dark_one"
          :class="getRoute() === `members/${member.uid}/tables` ? 'active' : ''" />
      </li>

    </ul>
  </div>
</template>
