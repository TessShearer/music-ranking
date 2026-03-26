<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import SidenavList from './SidenavList.vue'
import tess from '@/assets/img/tess.jpg'

const store = useStore()
const router = useRouter()

const member = computed(() => store.state.member)
const theme = computed(() => store.state.theme)
const sidebarOpen = computed(() => store.state.sidebarOpen)
const userExists = computed(() => !!member.value)

function mixWithWhite(hex, ratio = 0.6) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.round(r + (255 - r) * ratio)}, ${Math.round(g + (255 - g) * ratio)}, ${Math.round(b + (255 - b) * ratio)})`
}

const sidebarBg = computed(() =>
  theme.value?.light_one ? mixWithWhite(theme.value.light_one) : '#fff'
)

const sidebarStyle = computed(() => ({
  backgroundColor: sidebarBg.value,
  transform: sidebarOpen.value ? 'translateX(0)' : 'translateX(-100%)',
  transition: 'transform 0.3s ease',
}))

const toggleStyle = computed(() => ({
  left: sidebarOpen.value ? '15.625rem' : '0',
  transition: 'left 0.3s ease',
  backgroundColor: sidebarBg.value,
  color: theme.value?.dark_one || '#344767',
}))

const toggleSidebar = () => store.commit('toggleSidebar')

const handleLogout = async () => {
  await store.dispatch('logout')
  router.push('/signin')
}
</script>

<template>
  <!-- Sidebar panel (desktop only) -->
  <aside class="d-none d-lg-flex flex-column" :style="sidebarStyle"
    style="position: fixed; left: 0; top: 0; height: 100vh; width: 15.625rem; z-index: 1040; overflow: hidden;">

    <div class="d-flex align-items-center p-3">
      <img :src="tess" alt="Tess" class="rounded-circle" style="width: 48px; height: 48px; object-fit: cover;" />
      <p class="px-3 mb-0 text-wrap logo-text" :style="{ color: theme?.dark_one }">Hi! I'm Tess and I made this.</p>
    </div>

    <hr class="mt-0 horizontal dark" />

    <div class="flex-grow-1" style="overflow-y: auto;">
      <template v-if="userExists">
        <sidenav-list />
      </template>
      <template v-else>
        <div class="px-3 text-muted">Welcome! Set up your member profile to get started.</div>
      </template>
    </div>

    <div class="px-3 pb-2 d-flex flex-column gap-2">
      <router-link to="/profile" class="btn btn-sm w-100"
        :style="{ backgroundColor: theme?.light_two || '#e9ecef', color: theme?.dark_one || '#344767', border: 'none' }">
        Edit Settings
      </router-link>
      <button class="btn btn-sm w-100" @click="handleLogout"
        :style="{ backgroundColor: theme?.dark_two || '#344767', color: theme?.light_one || '#fff' }">
        Logout
      </button>
    </div>
  </aside>

  <!-- Chevron toggle tab (desktop only) -->
  <button class="d-none d-lg-flex align-items-center justify-content-center" @click="toggleSidebar"
    :style="toggleStyle"
    style="position: fixed; top: 1rem; z-index: 1041; border: none; border-radius: 0 6px 6px 0; width: 20px; height: 48px; cursor: pointer; padding: 0; font-size: 1.2rem;">
    {{ sidebarOpen ? '&#8249;' : '&#8250;' }}
  </button>
</template>
