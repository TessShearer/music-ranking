<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { auth } from '@/firebaseClient'
// TODO: replace with Firestore queries once database is connected
import ArtistsTable from './components/ArtistsTable.vue'

const route = useRoute()
const store = useStore()

const loggedInUser = computed(() => store.state.user)
const theme = computed(() => store.state.theme)
const musicId = computed(() => route.params.memberId)

const member = ref(null)
const isOwner = ref(false)

const loadMember = async () => {
  // TODO: load member from Firestore once database is connected
}

// Watch for user becoming available after a refresh
watch(loggedInUser, async (user) => {
  if (user?.uid) {
    await loadMember()
  }
}, { immediate: true })

// Watch for route changing
watch(musicId, async () => {
  if (loggedInUser.value?.uid) {
    await loadMember()
  }
})

// Fallback: restore user from Firebase auth on page refresh
onMounted(async () => {
  if (!loggedInUser.value) {
    await auth.authStateReady()
    if (auth.currentUser) {
      store.commit('setUser', auth.currentUser)
      await loadMember()
    }
  }
})
</script>



<template>
  <div v-if="member" class="container-fluid">
    <div class="page-header min-height-200" :style="{
    backgroundImage: theme?.header ? `url(${theme.header})` : '',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    marginRight: '-24px',
    marginLeft: '-34%',
    marginTop: '-5%',
    position: 'relative'
  }">
      <span class="mask" :style="{
    backgroundColor: theme?.dark_one || '#000',
    opacity: 0.3,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }"></span>
    </div>
    <div class="row">
      <div class="col-12">
        <artists-table :memberMusicId="member?.music_id" :theme="theme" :isOwner="isOwner" />
      </div>
    </div>
  </div>
</template>
