<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ArtistAddCard from './ArtistAddCard.vue'
import { db } from '@/firebaseClient'
import { collection, getDocs } from 'firebase/firestore'

const props = defineProps({
  memberUid: String,
  theme: Object,
  isOwner: Boolean
})

const artists = ref([])
const loading = ref(false)
const showArtistModal = ref(false)

// Computed theme styles
const buttonStyle = computed(() => ({
  backgroundColor: props.theme?.dark_two || '#198754',
  color: props.theme?.light_one || '#fff'
}))
const tableTextColor = computed(() => props.theme?.dark_one || '#000')
const tableBackground = computed(() => props.theme?.light_one || '#fff')

onMounted(() => {
  if (props.memberUid) fetchArtists()
})

watch(() => props.memberUid, (newId) => {
  if (newId) fetchArtists()
})

const fetchArtists = async () => {
  if (!props.memberUid) return
  loading.value = true
  const snap = await getDocs(collection(db, 'members', props.memberUid, 'artists'))
  artists.value = await Promise.all(snap.docs.map(async d => {
    const albumsSnap = await getDocs(collection(db, 'members', props.memberUid, 'artists', d.id, 'albums'))
    const albumCount = albumsSnap.size
    const songCount = albumsSnap.docs.reduce((sum, a) => sum + (a.data().songs?.length || 0), 0)
    return { id: d.id, albumCount, songCount, ...d.data() }
  }))
  loading.value = false
}

const handleArtistAdded = () => {
  showArtistModal.value = false
  fetchArtists()
}
</script>

<template>
  <div>

    <ArtistAddCard v-if="showArtistModal" :memberUid="memberUid" :theme="theme" @cancel="showArtistModal = false"
      @added="handleArtistAdded" />

    <!-- Desktop: floating card with table (md and up) -->
    <div class="d-none d-md-block">
      <div class="mb-3" v-if="isOwner">
        <button class="btn btn-large font-large ombre-overlay mt-n8" @click="showArtistModal = true" :style="buttonStyle">
          + &nbsp; Add Artist
        </button>
      </div>
      <div class="card mt-n6" :style="{ backgroundColor: tableBackground, border: '1px solid ' + (props.theme?.dark_one || '#000') + '44' }">
        <div class="card-body px-0 pt-0 pb-2">
          <div class="table-responsive p-0 mx-2">
            <table class="table align-items-center mb-0">
              <thead>
                <tr>
                  <th :style="{ color: tableTextColor }">Artist</th>
                  <th :style="{ color: tableTextColor }">Albums</th>
                  <th :style="{ color: tableTextColor }">Songs</th>
                  <th :style="{ color: tableTextColor }">Rankings</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading" class="text-center">
                  <td colspan="4" class="py-4"><em>Loading artists...</em></td>
                </tr>
                <tr v-for="artist in artists" :key="artist.id" class="table-row-hover"
                  :style="{ backgroundColor: tableBackground, color: props.theme?.dark_one }">
                  <td>{{ artist.name }}</td>
                  <td>{{ artist.albumCount }} Album{{ artist.albumCount !== 1 ? 's' : '' }}</td>
                  <td>{{ artist.songCount }} Song{{ artist.songCount !== 1 ? 's' : '' }}</td>
                  <td>
                    <button class="btn btn-outline" @click="$router.push(`/artists/${memberUid}/${artist.id}`)"
                      :style="{ color: props.theme?.dark_one, border: 'solid 1px ' + props.theme?.dark_one }">
                      {{ isOwner ? 'Rank Artist' : 'View Rankings' }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!loading && artists.length === 0">
                  <td colspan="4" class="text-center py-3 text-muted">No artists have been ranked yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile: full-width, no card (below md) -->
    <div class="d-block d-md-none" :style="{ backgroundColor: tableBackground }">
      <!-- Heading bar -->
      <div class="d-flex justify-content-between align-items-center px-3 py-2"
        :style="{ backgroundColor: props.theme?.light_two, borderBottom: '1px solid ' + (props.theme?.dark_one || '#000') + '22' }">
        <span class="fw-semibold" :style="{ color: tableTextColor }">Artists</span>
        <button v-if="isOwner" class="btn btn-sm" @click="showArtistModal = true" :style="buttonStyle">
          + Add Artist
        </button>
      </div>
      <!-- Artist rows -->
      <div v-if="loading" class="text-center py-4"><em>Loading artists...</em></div>
      <div v-else-if="artists.length === 0" class="text-center text-muted py-3">No artists yet.</div>
      <div v-else>
        <div v-for="artist in artists" :key="artist.id"
          class="d-flex justify-content-between align-items-center px-3 py-3"
          :style="{ borderBottom: '1px solid ' + (props.theme?.dark_one || '#000') + '18', color: tableTextColor }">
          <div>
            <div class="fw-semibold">{{ artist.name }}</div>
            <div style="font-size: 0.8rem; opacity: 0.65;">
              {{ artist.albumCount }} album{{ artist.albumCount !== 1 ? 's' : '' }} · {{ artist.songCount }} song{{ artist.songCount !== 1 ? 's' : '' }}
            </div>
          </div>
          <button class="btn btn-sm" @click="$router.push(`/artists/${memberUid}/${artist.id}`)"
            :style="{ color: props.theme?.dark_one, border: '1px solid ' + props.theme?.dark_one }">
            {{ isOwner ? 'Rank' : 'View' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.table-row-hover:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>
