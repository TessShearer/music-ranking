<script setup>
import { ref, onMounted } from 'vue'
import { auth, db } from '@/firebaseClient'
import { doc, setDoc } from 'firebase/firestore'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { themes as themeConfig } from '@/themes'

const router = useRouter()
const store = useStore()

const username = ref('')
const themes = ref([])
const selectedThemeId = ref(0)
const isPrivate = ref(false)
const error = ref('')

onMounted(async () => {
  await auth.authStateReady()
  if (!auth.currentUser) {
    error.value = 'User not found.'
    return
  }
  username.value = auth.currentUser.displayName || ''
  themes.value = Object.values(themeConfig)
})

const submitMember = async () => {
  error.value = ''

  if (!username.value.trim()) {
    error.value = 'Please enter a username.'
    return
  }

  try {
    const memberData = {
      member_name: username.value.trim(),
      theme_id: selectedThemeId.value,
      is_private: isPrivate.value,
    }
    await setDoc(doc(db, 'members', auth.currentUser.uid), memberData)
    store.commit('setMember', memberData)
    router.push('/profile')
  } catch (err) {
    error.value = err.message
  }
}
</script>

<template>
  <div class="card bg-transparent shadow-xl p-4">
    <h4 class="mb-3">Before we get started please create your profile - these settings can be changed at any time.</h4>

    <div class="mb-3">
      <label class="form-label">Username</label>
      <input v-model="username" type="text" class="form-control" placeholder="Enter a username" />
    </div>

    <div class="form-check form-switch mb-3">
      <input class="form-check-input" type="checkbox" id="privacySwitch" v-model="isPrivate" />
      <label class="form-check-label" for="privacySwitch">
        Make my profile private - If you choose this option your rankings will not be visible to others
      </label>
    </div>

    <div class="mb-3">
      <label class="form-label">Choose a Theme</label>
      <div class="d-flex flex-wrap gap-3 mt-2">
        <div
          v-for="theme in themes"
          :key="theme.id"
          class="text-center"
          style="cursor: pointer"
          @click="selectedThemeId = theme.id"
        >
          <div :class="['theme-circle', selectedThemeId === theme.id ? 'border border-dark border-3' : '']">
            <img
              :src="theme.image"
              class="img-fluid rounded-circle"
              style="width: 70px; height: 70px; object-fit: cover"
              :alt="theme.name"
            />
          </div>
          <small class="d-block mt-2">{{ theme.name }}</small>
        </div>
      </div>
    </div>

    <div class="text-end">
      <button class="btn btn-primary" @click="submitMember">Let's go!</button>
    </div>

    <div v-if="error" class="text-danger mt-3">{{ error }}</div>
  </div>
</template>

<style scoped>
.theme-circle {
  display: inline-block;
  border-radius: 50%;
  padding: 4px;
  transition: border 0.2s ease-in-out;
}
</style>
