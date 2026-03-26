<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { db } from '@/firebaseClient'
import { collection, getDocs } from 'firebase/firestore'
import { getTheme } from '@/themes'
import menu from '@/assets/img/icons/menu.png'

const store = useStore()
const router = useRouter()

const user = computed(() => store.state.user)
const theme = computed(() => store.state.theme)
const showDropdown = ref(false)
const members = ref([])

const userName = computed(() => user.value?.displayName || user.value?.email || 'Guest')

const menuIconFilter = computed(() => {
  const hex = theme.value?.light_one?.replace('#', '')
  if (!hex || hex.length < 6) return 'none'
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (r * 299 + g * 587 + b * 114) / 1000
  return luminance < 128 ? 'invert(1)' : 'none'
})

const dropdownRef = ref(null)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)
  const snap = await getDocs(collection(db, 'members'))
  const list = snap.docs.map(d => ({
    uid: d.id,
    ...d.data(),
    theme: getTheme(d.data().theme_id ?? 0),
  }))
  const currentUid = user.value?.uid
  members.value = list.sort((a, b) => {
    if (a.uid === currentUid) return -1
    if (b.uid === currentUid) return 1
    return 0
  })
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleLogout = async () => {
  await store.dispatch('logout')
  router.push('/signin')
}
</script>



<template>
  <nav class="navbar navbar-main navbar-expand-lg px-0 m-4 shadow border-radius-xl d-lg-none"
    :style="{ backgroundColor: theme?.light_two || '#f5f5f5', zIndex: 1050 }" id="navbarBlur" data-scroll="true">
    <div class="px-3 py-1 container-fluid d-flex justify-content-between align-items-center">

      <!-- Mobile dropdown toggle -->
      <div class="position-relative" ref="dropdownRef">
        <button class="btn btn-outline my-auto" @click="toggleDropdown">
          <img :src="menu" alt="Menu" class="img-fluid" style="max-height: 18px;" :style="{ filter: menuIconFilter }" />
        </button>

        <ul v-if="showDropdown" class="position-absolute mt-2 shadow rounded dropdown-menu d-block"
          style="left: 0; z-index: 2000; min-width: 200px"
          :style="{ backgroundColor: theme?.light_one || '#fff' }">
          <li class="m-2 p-1 rounded" v-for="member in members" :key="member.uid"
            :style="{ backgroundColor: member.theme?.light_one || '#fff' }">
            <router-link class="dropdown-item d-flex align-items-center gap-2"
              :to="`/members/${member.uid}/tables`" @click="showDropdown = false">
              <img :src="member.theme?.image" alt="Theme Artist" class="rounded-circle"
                style="width: 32px; height: 32px; object-fit: cover;" />
              <span :style="{ color: member.theme?.dark_one }">
                {{ member.uid === user?.uid ? `${member.member_name} (You)` : member.member_name }}
              </span>
            </router-link>
          </li>
          <li><hr class="dropdown-divider" /></li>
          <li class="m-2 p-1 rounded">
            <router-link class="dropdown-item d-flex align-items-center gap-2" to="/profile"
              @click="showDropdown = false">
              <img src="/themes/settings.jpg" alt="Settings" class="rounded-circle"
                style="width: 32px; height: 32px; object-fit: cover;" />
              <span :style="{ color: theme?.dark_one }">Edit Settings</span>
            </router-link>
          </li>
          <li><hr class="dropdown-divider" /></li>
          <li class="m-2 p-1">
            <button class="btn btn-sm w-100"
              :style="{ backgroundColor: theme?.dark_two || '#344767', color: theme?.light_one || '#fff' }"
              @click="handleLogout">
              Logout
            </button>
          </li>
        </ul>
      </div>

      <h6 class="mb-0" :style="{ color: theme?.dark_one || '#344767' }">Welcome, {{ userName }}</h6>

    </div>
  </nav>
</template>
