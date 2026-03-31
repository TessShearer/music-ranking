<script setup>
import { computed, ref, onMounted, watch } from "vue"
import { useRoute } from "vue-router"
import { useStore } from "vuex"
import SidenavItem from "./SidenavItem.vue"
import { auth, db } from "@/firebaseClient";
import { collection, getDocs } from "firebase/firestore";
import { getTheme } from "@/themes";

const store = useStore()
const route = useRoute()

const members = ref([]);
const user = computed(() => auth.currentUser)
const viewingUid = computed(() => route.params.memberId || null)

const getRoute = () => {
  const routeArr = route.path.split("/")
  return routeArr[1] + (routeArr[2] ? `/${routeArr[2]}` : "")
}

const sortedMembers = computed(() => {
  const currentUid = auth.currentUser?.uid
  const viewedUid = viewingUid.value
  return [...members.value].sort((a, b) => {
    if (a.uid === viewedUid) return -1
    if (b.uid === viewedUid) return 1
    if (a.uid === currentUid) return -1
    if (b.uid === currentUid) return 1
    return 0
  })
})

onMounted(async () => {
  await auth.authStateReady()
  if (!auth.currentUser) return
  const snap = await getDocs(collection(db, 'members'));
  members.value = snap.docs.map(d => ({
    uid: d.id,
    ...d.data(),
    theme: getTheme(d.data().theme_id ?? 0),
  }));
});

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
    <TransitionGroup name="member-list" tag="ul" class="navbar-nav">
      <li class="nav-item" v-for="member in sortedMembers" :key="member.uid">
        <sidenav-item
          :to="`/members/${member.uid}/tables`"
          :navText="member.uid === user?.uid ? `${member.member_name} (You)` : member.member_name"
          :path="member.theme?.image"
          :background="member.theme?.light_one"
          :text="member.theme?.dark_one"
          :isSelected="member.uid === viewingUid"
          :class="getRoute() === `members/${member.uid}/tables` ? 'active' : ''"
        />
      </li>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.member-list-move {
  transition: transform 0.45s ease;
}
</style>
