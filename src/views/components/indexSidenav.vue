<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import SidenavList from './SidenavList.vue'
import tess from '@/assets/img/tess.jpg'

const store = useStore()

const isRTL = computed(() => store.state.isRTL)
const layout = computed(() => store.state.layout)
const sidebarType = computed(() => store.state.sidebarType)

// Pull from Vuex store
const member = computed(() => store.state.member)
const theme = computed(() => store.state.theme)

// Determine whether the user has a member profile
const userExists = computed(() => !!member.value)

// Mix a hex color with white to produce a lighter solid shade.
// ratio = how much white to blend in (0 = original, 1 = pure white)
function mixWithWhite(hex, ratio = 0.6) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r + (255 - r) * ratio)}, ${Math.round(g + (255 - g) * ratio)}, ${Math.round(b + (255 - b) * ratio)})`;
}

// When a theme color is set, omit the sidebarType class (e.g. bg-white) since
// Bootstrap applies it with !important and would override the inline style.
const effectiveSidebarType = computed(() =>
  theme.value?.light_one ? '' : sidebarType.value
)
const sidebarStyle = computed(() => ({
  backgroundColor: theme.value?.light_one ? mixWithWhite(theme.value.light_one) : undefined,
}))
</script>

<template>

  <div v-show="layout === 'default'" class="min-height-300 position-absolute w-100" />

  <aside class="my-3 overflow-auto border-0 sidenav navbar navbar-vertical navbar-expand-xs border-radius-lg d-none d-lg-block" :class="`${isRTL ? 'me-3 rotate-caret fixed-end' : 'fixed-start ms-3'}
      ${layout === 'landing' ? 'bg-transparent shadow-none' : ' '
    } ${effectiveSidebarType}`" :style="sidebarStyle" id="sidenav-main">

    <div class="m-0 navbar-brand flex d-flex">
      <img :src="tess" alt="Tess" class="rounded-circle" style="min-width: 8vh; min-height: 8vh; object-fit: cover;" />
      <p class="px-3 mb-0 text-wrap logo-text text-one">Hi! I'm Tess and I made this.</p>
    </div>

    <hr class="mt-0 horizontal dark" />
    <template v-if="userExists">
      <sidenav-list />
    </template>
    <template v-else>
      <div class="px-3 text-muted">Welcome! Set up your member profile to get started.</div>
    </template>


  </aside>
</template>
