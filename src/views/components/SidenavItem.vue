<script setup>
import { computed } from "vue";
import { useStore } from "vuex";

const store = useStore();
const isRTL = computed(() => store.state.isRTL);
const sidebarMinimize = () => store.commit("sidebarMinimize");

const minimizeSidebar = () => {
  if (window.innerWidth < 1200) {
    sidebarMinimize();
  }
};

defineProps({
  to: {
    type: String,
    required: true,
  },
  navText: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    default: null,
  },
  background: {
    type: String,
    default: null,
  },
  text: {
    type: String,
    default: null,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <router-link
    :to="to"
    class="nav-link my-2 px-3 sidenav-item"
    :class="{ 'sidenav-item-selected': isSelected }"
    :style="{ backgroundColor: background, color: text }"
    @click="minimizeSidebar"
  >
    <!-- Icon/avatar -->
    <div
      class="icon text-center d-flex align-items-center justify-content-center flex-shrink-0"
      :style="isSelected
        ? { width: '7vh', height: '7vh', minWidth: '7vh', padding: '0', transition: 'width 0.4s ease, height 0.4s ease' }
        : { width: '28px', height: '28px', minWidth: '28px', padding: '0', transition: 'width 0.4s ease, height 0.4s ease' }"
    >
      <img
        :src="path ? path : '/themes/settings.jpg'"
        alt="Theme Image"
        class="rounded-circle"
        style="width: 100%; height: 100%; object-fit: cover;"
      />
    </div>

    <!-- Name -->
    <span
      class="nav-link-text"
      :class="isRTL ? 'me-1' : 'ms-2'"
      :style="isSelected
        ? { fontSize: '1.1rem', fontWeight: '700', whiteSpace: 'normal', lineHeight: '1.2' }
        : {}"
    >
      {{ navText }}
    </span>
  </router-link>
</template>

<style scoped>
.sidenav-item {
  transition: padding 0.4s ease;
}

.sidenav-item-selected {
  padding-top: 0.65rem !important;
  padding-bottom: 0.65rem !important;
}
</style>
