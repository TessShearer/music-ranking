<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { handleSpotifyCallback } from '@/spotify'

const router = useRouter()
const route = useRoute()
const errorMsg = ref(null)

onMounted(async () => {
  if (route.query.error) {
    errorMsg.value = 'Spotify authorization was denied.'
    return
  }
  const code = route.query.code
  if (!code) {
    errorMsg.value = 'No authorization code received from Spotify.'
    return
  }
  try {
    const returnPath = await handleSpotifyCallback(code)
    router.replace(returnPath)
  } catch (e) {
    errorMsg.value = e.message
  }
})
</script>

<template>
  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif;">
    <div style="text-align: center; padding: 2rem;">
      <div v-if="!errorMsg">
        <p style="font-size: 1.1rem;">Connecting to Spotify...</p>
      </div>
      <div v-else>
        <p style="color: #dc3545; font-size: 1rem;">{{ errorMsg }}</p>
        <a href="/" style="color: #1DB954;">Go home</a>
      </div>
    </div>
  </div>
</template>
