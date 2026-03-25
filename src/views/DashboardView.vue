<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/firebaseClient'

const user = ref(null)
const router = useRouter()

onMounted(async () => {
  await auth.authStateReady()
  if (!auth.currentUser) {
    router.push('/signin')
    return
  }
  user.value = auth.currentUser
})
</script>

<template>
  <div class="py-4 container-fluid">
    <div v-if="user">
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Name:</strong> {{ user.displayName || 'N/A' }}</p>
    </div>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>
