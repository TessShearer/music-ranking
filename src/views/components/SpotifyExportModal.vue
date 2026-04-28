<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  searchSpotifyTrack,
  createSpotifyPlaylist,
  addTracksToSpotifyPlaylist,
  clearSpotifyToken,
  startSpotifyAuth,
} from '@/spotify'
import { useRoute } from 'vue-router'

const props = defineProps({
  artistName: String,
  songs: Array,        // [{ title: String }]
  playlistName: String,
  token: String,
  theme: Object,
})

const emit = defineEmits(['close'])
const route = useRoute()

// 'searching' | 'preview' | 'creating' | 'done' | 'error'
const phase = ref('searching')
const progress = ref(0)
const foundTracks = ref([])   // [{ songTitle, uri, selected }]
const notFoundTitles = ref([])
const playlistUrl = ref(null)
const errorMsg = ref(null)
const needsReauth = ref(false)

const reconnectSpotify = async () => {
  clearSpotifyToken()
  emit('close')
  await startSpotifyAuth(route.fullPath)
}

const selectedCount = computed(() => foundTracks.value.filter(t => t.selected).length)

onMounted(async () => {
  for (let i = 0; i < props.songs.length; i++) {
    const song = props.songs[i]
    try {
      const track = await searchSpotifyTrack(props.artistName, song.title, props.token)
      if (track) {
        foundTracks.value.push({ songTitle: song.title, uri: track.uri, selected: true })
      } else {
        notFoundTitles.value.push(song.title)
      }
    } catch {
      notFoundTitles.value.push(song.title)
    }
    progress.value = Math.round(((i + 1) / props.songs.length) * 100)
  }
  phase.value = 'preview'
})

const confirm = async () => {
  const uris = foundTracks.value.filter(t => t.selected).map(t => t.uri)
  if (uris.length === 0) return
  phase.value = 'creating'
  try {
    const playlist = await createSpotifyPlaylist(props.playlistName, props.token)
    await addTracksToSpotifyPlaylist(playlist.id, uris, props.token)
    playlistUrl.value = playlist.external_urls.spotify
    phase.value = 'done'
  } catch (e) {
    errorMsg.value = e.message
    needsReauth.value = e.status === 403
    phase.value = 'error'
  }
}
</script>

<template>
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog">
      <div class="modal-content" :style="{ backgroundColor: theme?.light_one, color: theme?.dark_one }">

        <div class="modal-header"
          :style="{ backgroundColor: theme?.light_two, borderColor: (theme?.dark_one || '#000') + '22' }">
          <h5 class="modal-title" :style="{ color: theme?.dark_one }">Export to Spotify</h5>
          <button type="button" class="btn-close" @click="emit('close')"></button>
        </div>

        <div class="modal-body">

          <!-- Searching -->
          <div v-if="phase === 'searching'">
            <p :style="{ color: theme?.dark_one }">
              Searching Spotify for {{ songs.length }} track{{ songs.length !== 1 ? 's' : '' }}...
            </p>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar" role="progressbar"
                :style="{ width: progress + '%', backgroundColor: theme?.dark_two }">
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div v-else-if="phase === 'preview'">
            <p style="font-size: 0.9rem;" :style="{ color: theme?.dark_one }">
              Found <strong>{{ foundTracks.length }}</strong> of {{ songs.length }} tracks on Spotify.
              <span v-if="notFoundTitles.length > 0" style="opacity: 0.7;">
                {{ notFoundTitles.length }} not found.
              </span>
            </p>

            <div style="max-height: 260px; overflow-y: auto;">
              <ul class="list-unstyled mb-0">
                <li v-for="track in foundTracks" :key="track.uri"
                  class="d-flex align-items-center gap-2 py-1"
                  style="font-size: 0.85rem; border-bottom: 1px solid rgba(0,0,0,0.06);">
                  <input type="checkbox" v-model="track.selected" class="form-check-input mt-0 flex-shrink-0" />
                  <span :style="{ color: theme?.dark_one }">{{ track.songTitle }}</span>
                </li>
              </ul>
              <div v-if="notFoundTitles.length > 0" class="mt-2 pt-1"
                style="border-top: 1px solid rgba(0,0,0,0.08);">
                <p style="font-size: 0.78rem; margin-bottom: 0.25rem; font-weight: 600;"
                  :style="{ color: theme?.dark_one, opacity: 0.6 }">Not found on Spotify:</p>
                <p style="font-size: 0.78rem; margin: 0; line-height: 1.5;"
                  :style="{ color: theme?.dark_one, opacity: 0.5 }">
                  {{ notFoundTitles.join(', ') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Creating -->
          <div v-else-if="phase === 'creating'">
            <p :style="{ color: theme?.dark_one }">Creating playlist in Spotify...</p>
          </div>

          <!-- Done -->
          <div v-else-if="phase === 'done'">
            <p :style="{ color: theme?.dark_one }">
              Playlist <strong>"{{ playlistName }}"</strong> created with {{ selectedCount }} track{{ selectedCount !== 1 ? 's' : '' }}.
            </p>
            <a :href="playlistUrl" target="_blank" rel="noopener noreferrer"
              class="btn btn-sm"
              :style="{ backgroundColor: '#1DB954', color: '#fff', border: 'none' }">
              Open in Spotify
            </a>
          </div>

          <!-- Error -->
          <div v-else-if="phase === 'error'">
            <p class="text-danger" style="font-size: 0.9rem;">{{ errorMsg }}</p>
            <div v-if="needsReauth">
              <p style="font-size: 0.82rem;" :style="{ color: theme?.dark_one, opacity: 0.7 }">
                Your Spotify session is missing the required permission. Click below to reconnect — Spotify will ask you to approve access again.
              </p>
              <button class="btn btn-sm" style="background-color: #1DB954; color: #fff; border: none;"
                @click="reconnectSpotify">
                Reconnect Spotify
              </button>
            </div>
            <p v-else style="font-size: 0.8rem;" :style="{ color: theme?.dark_one, opacity: 0.6 }">
              Close this and try again.
            </p>
          </div>

        </div>

        <div class="modal-footer" :style="{ borderColor: (theme?.dark_one || '#000') + '22' }">
          <button v-if="phase === 'preview' && selectedCount > 0"
            class="btn btn-sm"
            :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
            @click="confirm">
            Create Playlist ({{ selectedCount }} track{{ selectedCount !== 1 ? 's' : '' }})
          </button>
          <button class="btn btn-sm btn-secondary" @click="emit('close')">
            {{ phase === 'done' ? 'Close' : 'Cancel' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
