<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import ArtistRankingCard from './components/ArtistRankingCard.vue'
import trash from '@/assets/img/icons/trash.png'
import note from '@/assets/img/icons/note.png'
import menu from '@/assets/img/icons/menu.png'
import pencil from '@/assets/img/icons/pencil.png'
import { auth, db } from '@/firebaseClient'
import { getTheme } from '@/themes'
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore'

const store = useStore()
const route = useRoute()
const router = useRouter()
const memberId = route.params.memberId
const artistId = route.params.artistId
const showModal = ref(false)
const modalMessage = ref('')
const modalAction = ref(null)

const user = computed(() => store.state.user)
const theme = computed(() => store.state.theme)
const isLoggedIn = computed(() => !!user.value)
const isOwner = computed(() => isLoggedIn.value && user.value?.uid === memberId)

const artist = ref(null)
const member = ref(null)
const albums = ref([])
const newAlbumName = ref('')
const error = ref(null)
const showAlbumInput = ref(false)
const showNoteModal = ref(false)
const currentNoteSong = ref(null)
const noteText = ref('')
const toastMessage = ref('')
const showToast = ref(false)
const editingAlbumId = ref(null)
const editingAlbumNameId = ref(null)
const editedAlbumTitle = ref('')
const editingRanking = ref(false)
const albumRankingExpanded = ref(false)

function showToastMessage(message, timeout = 3000) {
  toastMessage.value = message
  showToast.value = true
  setTimeout(() => { showToast.value = false; toastMessage.value = '' }, timeout)
}

function showConfirmModal(message, action) {
  modalMessage.value = message
  modalAction.value = () => { action(); closeModal() }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  modalMessage.value = ''
  modalAction.value = null
}

const albumsRef = () => collection(db, 'members', memberId, 'artists', artistId, 'albums')
const albumRef = (albumId) => doc(db, 'members', memberId, 'artists', artistId, 'albums', albumId)

const loadAlbums = async () => {
  const snap = await getDocs(query(albumsRef(), orderBy('rank')))
  albums.value = snap.docs.map(d => ({
    addingSong: false,
    newSongName: '',
    songs: [],
    expanded: false,
    ...d.data(),
    id: d.id,
  }))
}

const addAlbum = async () => {
  if (!newAlbumName.value.trim()) return
  await addDoc(albumsRef(), { title: newAlbumName.value.trim(), rank: albums.value.length, songs: [] })
  newAlbumName.value = ''
  showAlbumInput.value = false
  await loadAlbums()
}

const saveAlbumTitle = async (albumId) => {
  await updateDoc(albumRef(albumId), { title: editedAlbumTitle.value })
  await loadAlbums()
}

const addSong = async (albumId, songName) => {
  if (!songName.trim()) return
  const snap = await getDoc(albumRef(albumId))
  const songs = snap.data().songs || []
  songs.push({ id: crypto.randomUUID(), title: songName.trim(), note: '' })
  await updateDoc(albumRef(albumId), { songs })
  await loadAlbums()
}

const deleteSong = async (songId) => {
  for (const album of albums.value) {
    if (album.songs.some(s => s.id === songId)) {
      await updateDoc(albumRef(album.id), { songs: album.songs.filter(s => s.id !== songId) })
      break
    }
  }
  await loadAlbums()
}

const updateSongOrder = async (album) => {
  await updateDoc(albumRef(album.id), { songs: album.songs.map(({ id, title, note }) => ({ id, title, note })) })
}

const updateAlbumOrder = async () => {
  const batch = writeBatch(db)
  albums.value.forEach((album, index) => batch.update(albumRef(album.id), { rank: index }))
  await batch.commit()
}

const deleteAlbum = (albumId) => {
  showConfirmModal(
    'Are you sure you want to delete this album? This will permanently delete the album and all its songs.',
    async () => { await deleteAlbumConfirmed(albumId); showToastMessage('Album deleted successfully.') }
  )
}

async function deleteAlbumConfirmed(albumId) {
  await deleteDoc(albumRef(albumId))
  await loadAlbums()
}

const deleteArtist = () => {
  showConfirmModal(
    'Are you sure you want to delete this artist? This will permanently delete all albums and songs associated with them.',
    async () => { await deleteArtistConfirmed() }
  )
}

const deleteArtistConfirmed = async () => {
  const snap = await getDocs(albumsRef())
  const batch = writeBatch(db)
  snap.docs.forEach(d => batch.delete(d.ref))
  batch.delete(doc(db, 'members', memberId, 'artists', artistId))
  await batch.commit()
  showToastMessage('Artist deleted successfully.')
  router.push(`/members/${memberId}/tables`)
}

const openNoteModal = (song) => {
  currentNoteSong.value = song
  noteText.value = song.note || ''
  showNoteModal.value = true
}

const saveNote = async () => {
  const album = albums.value.find(a => a.songs.some(s => s.id === currentNoteSong.value.id))
  if (album) {
    const songs = album.songs.map(s => s.id === currentNoteSong.value.id ? { ...s, note: noteText.value } : s)
    await updateDoc(albumRef(album.id), { songs })
  }
  currentNoteSong.value.note = noteText.value
  showNoteModal.value = false
}

onMounted(async () => {
  await auth.authStateReady()
  if (auth.currentUser && !user.value) store.commit('setUser', auth.currentUser)

  const [memberSnap, artistSnap] = await Promise.all([
    getDoc(doc(db, 'members', memberId)),
    getDoc(doc(db, 'members', memberId, 'artists', artistId)),
  ])
  if (memberSnap.exists()) {
    member.value = { uid: memberSnap.id, ...memberSnap.data() }
    store.commit('setTheme', getTheme(memberSnap.data().theme_id ?? 0))
  }
  if (artistSnap.exists()) artist.value = { id: artistSnap.id, ...artistSnap.data() }
  await loadAlbums()
})

onUnmounted(() => {
  store.commit('setTheme', getTheme(store.state.member?.theme_id ?? 0))
})

</script>

<template>
  <div v-if="member" class="container-fluid py-4">




    <!-- Page header -->
    <div class="card mb-1"
      :style="{ backgroundColor: theme?.light_one || '#f5f5f5', color: theme?.dark_one || '#333', border: '1px solid ' + (theme?.dark_one || '#000') + '44' }">
      <div class="card-body d-flex flex-wrap align-items-center justify-content-between">
        <h3 class="mb-0" :style="{ color: theme?.dark_one }">{{ artist?.name }}</h3>
        <button class="btn btn-outline my-auto" @click="router.push(`/members/${memberId}/tables`)" :style="{
    border: 'solid 1px' + theme?.dark_one,
    color: theme?.dark_one
  }">
          &lt; <span class="d-none d-md-inline">Back to Artists</span>
        </button>
      </div>
    </div>

    <!-- Album Ranking on Top -->
    <div class="row mb-4">
      <div class="col-12">
        <artist-ranking-card :theme="theme" :isOwner="isOwner" :memberId="memberId" :artistId="artistId" />

        <div class="card" :style="{ backgroundColor: theme?.light_one, color: theme?.dark_one, border: '1px solid ' + (theme?.dark_one || '#000') + '44' }">

          <!-- Card Header -->
          <div class="card-header d-flex align-items-center justify-content-between py-2 px-3"
            :style="{ backgroundColor: theme?.light_two, color: theme?.dark_one, border: 'none', borderBottom: '1px solid ' + (theme?.dark_one || '#000') + '22' }">

            <div class="d-flex align-items-center gap-2">
              <h6 class="mb-0 fw-semibold" :style="{ color: theme?.dark_one }">Album Ranking</h6>
              <button v-if="isOwner && !editingRanking" class="btn btn-sm btn-link p-0" title="Reorder albums"
                @click="editingRanking = true">
                <img :src="pencil" alt="Edit" style="max-height: 11px; opacity: 0.7; margin-top: 4px;" />
              </button>
            </div>

            <div class="d-flex align-items-center gap-2">
              <!-- Done reordering -->
              <button v-if="isOwner && editingRanking" class="btn btn-sm px-2 py-1"
                :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
                @click="editingRanking = false">
                Done
              </button>
              <!-- Add album -->
              <template v-if="isOwner && !showAlbumInput">
                <button class="btn btn-sm px-2 py-1"
                  :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
                  @click="showAlbumInput = true; albumRankingExpanded = true">
                  + Add Album
                </button>
              </template>
              <!-- Mobile collapse toggle -->
              <button class="d-md-none btn btn-sm px-2 py-1 d-flex align-items-center justify-content-center"
                style="width: 30px; height: 28px;"
                :style="{ color: theme?.dark_one, border: '1px solid ' + theme?.dark_one }"
                @click="albumRankingExpanded = !albumRankingExpanded">
                <span class="chevron" :class="albumRankingExpanded ? 'chevron-up' : 'chevron-down'"></span>
              </button>
            </div>
          </div>

          <!-- Card Body -->
          <div class="card-body py-2 px-3" :class="{ 'd-none d-md-block': !albumRankingExpanded }">

            <!-- Add album inline form -->
            <div v-if="isOwner && showAlbumInput" class="d-flex align-items-stretch gap-2 mb-3">
              <input v-model="newAlbumName" type="text" class="form-control form-control-sm" placeholder="New album name"
                :style="{ backgroundColor: theme?.light_two, color: theme?.dark_one, borderColor: theme?.dark_one }" />
              <button class="btn btn-sm px-2"
                :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
                @click="addAlbum">
                Add
              </button>
              <button class="btn btn-sm px-2"
                :style="{ color: theme?.dark_one, border: '1px solid ' + theme?.dark_one }"
                @click="showAlbumInput = false">
                ✗
              </button>
            </div>

            <!-- Draggable list -->
            <draggable v-if="isOwner && editingRanking" v-model="albums" item-key="id" @end="updateAlbumOrder" tag="ul"
              class="song-list mb-0">
              <template #item="{ element, index }">
                <li class="song-row d-flex justify-content-between align-items-center px-1 py-1"
                  :style="{ color: theme?.dark_one }">
                  <span style="font-size: 0.9rem;">#{{ index + 1 }} — {{ element.title }}</span>
                  <img :src="menu" alt="drag" style="max-height: 12px; opacity: 0.5;" />
                </li>
              </template>
            </draggable>

            <!-- Read-only list -->
            <ul v-else class="song-list mb-0 view-only">
              <li v-for="(album, index) in albums" :key="album.id"
                class="song-row d-flex justify-content-between align-items-center px-1 py-1 view-only"
                :style="{ color: theme?.dark_one }">
                <span style="font-size: 0.9rem;">#{{ index + 1 }} — {{ album.title }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- Album Cards Grid -->
    <div class="row">
      <div v-if="albums.length > 0" class="col-12">
        <div class="row">
          <div v-for="album in albums" :key="album.id" class="col-md-6 mb-4">
            <div class="card shadow" :style="{ backgroundColor: theme?.light_one, color: theme?.dark_one, border: '1px solid ' + (theme?.dark_one || '#000') + '44' }">

              <!-- Card Header: title + contextual action buttons -->
              <div class="card-header d-flex align-items-center justify-content-between py-2 px-3"
                :style="{ backgroundColor: theme?.light_two, color: theme?.dark_one, border: 'none', borderBottom: '1px solid ' + (theme?.dark_one || '#000') + '22' }">

                <!-- Title or rename input -->
                <div class="flex-grow-1 me-2 d-flex align-items-center gap-2">
                  <input v-if="editingAlbumNameId === album.id" v-model="editedAlbumTitle" type="text"
                    class="form-control form-control-sm"
                    :style="{ backgroundColor: theme?.light_one, color: theme?.dark_one, borderColor: theme?.dark_one }" />
                  <template v-else>
                    <h6 class="mb-0 fw-semibold" :style="{ color: theme?.dark_one }">{{ album.title }}</h6>
                    <button v-if="editingAlbumId === album.id" class="btn btn-sm btn-link p-0" title="Rename album"
                      @click="() => { editingAlbumNameId = album.id; editedAlbumTitle = album.title }">
                      <img :src="pencil" alt="Rename" style="max-height: 11px; opacity: 0.7; margin-top: 4px;" />
                    </button>
                  </template>
                </div>

                <!-- Right-side buttons — one of three states -->
                <div class="d-flex align-items-center gap-1">
                  <!-- Renaming: confirm / cancel -->
                  <template v-if="editingAlbumNameId === album.id">
                    <button class="btn btn-sm px-2 py-1"
                      :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
                      @click="saveAlbumTitle(album.id); editingAlbumNameId = null">
                      ✓
                    </button>
                    <button class="btn btn-sm px-2 py-1"
                      :style="{ color: theme?.dark_one, border: '1px solid ' + theme?.dark_one }"
                      @click="editingAlbumNameId = null">
                      ✗
                    </button>
                  </template>

                  <!-- Card editing: trash + done -->
                  <template v-else-if="editingAlbumId === album.id">
                    <button class="btn btn-sm px-2 py-1 btn-outline-danger" title="Delete album"
                      @click="deleteAlbum(album.id)">
                      <img :src="trash" alt="Delete" style="max-height: 12px;" />
                    </button>
                    <button class="btn btn-sm px-2 py-1"
                      :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
                      @click="editingAlbumId = null">
                      Done
                    </button>
                  </template>

                  <!-- View mode: pencil to enter edit -->
                  <template v-else-if="isOwner">
                    <button class="btn btn-sm btn-link p-1" title="Edit album"
                      @click="() => { editingAlbumId = album.id; editedAlbumTitle = album.title; album.expanded = true }">
                      <img :src="pencil" alt="Edit" style="max-height: 13px; opacity: 0.6;" />
                    </button>
                  </template>
                  <!-- Mobile collapse toggle (always visible on mobile) -->
                  <button class="d-md-none btn btn-sm px-2 py-1 d-flex align-items-center justify-content-center ms-1"
                    style="width: 30px; height: 28px;"
                    :style="{ color: theme?.dark_one, border: '1px solid ' + theme?.dark_one }"
                    @click="album.expanded = !album.expanded">
                    <span class="chevron" :class="album.expanded ? 'chevron-up' : 'chevron-down'"></span>
                  </button>
                </div>
              </div>

              <!-- Card Body: song list -->
              <div class="card-body py-2 px-3" :class="{ 'd-none d-md-block': !album.expanded }">
                <!-- Editable draggable song list -->
                <draggable v-if="isOwner && editingAlbumId === album.id" v-model="album.songs"
                  :group="{ name: 'songs-' + album.id }" @end="updateSongOrder(album)" tag="ul"
                  class="song-list mb-2" :class="{ 'two-columns': album.songs.length >= 10 }">
                  <template #item="{ element, index }">
                    <li class="song-row d-flex justify-content-between align-items-center px-1 py-1"
                      :style="{ color: theme?.dark_one }">
                      <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-sm btn-link text-danger p-0 lh-1" style="font-size: 0.8rem;"
                          @click="deleteSong(element.id)" title="Remove">×</button>
                        <span style="font-size: 0.9rem;">#{{ index + 1 }} — {{ element.title }}</span>
                      </div>
                      <button class="btn btn-sm btn-link p-0 d-flex align-items-center gap-1"
                        :style="{ color: element.note ? theme?.dark_two : theme?.dark_one + '66' }"
                        @click="openNoteModal(element)" title="Note">
                        <span v-if="!element.note" style="font-size: 0.75rem; line-height: 1;">+</span>
                        <img :src="note" alt="note" style="max-height: 14px; min-width: 14px;" />
                      </button>
                    </li>
                  </template>
                </draggable>

                <!-- Read-only song list -->
                <ul v-else class="song-list mb-2 view-only" :class="{ 'two-columns': album.songs.length >= 10 }">
                  <li v-for="(song, index) in album.songs" :key="song.id"
                    class="song-row d-flex justify-content-between align-items-center px-1 py-1 view-only"
                    :style="{ color: theme?.dark_one }">
                    <span style="font-size: 0.9rem;">#{{ index + 1 }} — {{ song.title }}</span>
                    <button v-if="song.note" class="btn btn-sm btn-link p-0"
                      :style="{ color: theme?.dark_two }" @click="openNoteModal(song)" title="Note">
                      <img :src="note" alt="note" style="max-height: 14px; min-width: 14px;" />
                    </button>
                  </li>
                </ul>

                <div v-if="album.songs.length === 0" class="text-muted small mb-2">No songs yet</div>

                <!-- Add Song -->
                <div v-if="isOwner && editingAlbumId === album.id" class="mt-2">
                  <template v-if="!album.addingSong">
                    <button class="btn btn-sm" :style="{ color: theme?.dark_one, border: '1px solid ' + theme?.dark_one }"
                      @click="album.addingSong = true">
                      + Add Song
                    </button>
                  </template>
                  <template v-else>
                    <div class="d-flex align-items-center gap-2">
                      <input v-model="album.newSongName" placeholder="Song title" autofocus
                        class="form-control form-control-sm"
                        :style="{ backgroundColor: theme?.light_two, color: theme?.dark_one, borderColor: theme?.dark_one }"
                        @keyup.enter="addSong(album.id, album.newSongName); album.newSongName = ''; album.addingSong = false" />
                      <button class="btn btn-sm px-2"
                        :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
                        @click="addSong(album.id, album.newSongName); album.newSongName = ''; album.addingSong = false">
                        Add
                      </button>
                      <button class="btn btn-sm px-2"
                        :style="{ color: theme?.dark_one, border: '1px solid ' + theme?.dark_one }"
                        @click="album.addingSong = false">
                        ✗
                      </button>
                    </div>
                  </template>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Note Modal (outside album loop) -->
    <div v-if="showNoteModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
      <div class="modal-dialog">
        <div class="modal-content" :style="{ backgroundColor: theme?.light_one, color: theme?.dark_one }">
          <div class="modal-header">
            <h5 class="modal-title">Song Note</h5>
            <button type="button" class="btn-close" @click="showNoteModal = false"></button>
          </div>
          <div class="modal-body">
            <p><strong>{{ currentNoteSong?.title }}</strong></p>
            <textarea v-model="noteText" class="form-control" rows="4" :readonly="!isOwner"
              :style="{ color: theme?.dark_one }" />
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showNoteModal = false">
              {{ isOwner ? 'Cancel' : 'Done' }}
            </button>
            <button v-if="isOwner" class="btn btn-primary" @click="saveNote">Save</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isOwner" class="mt-4 text-end">
      <button class="btn btn-danger" @click="deleteArtist">
        Delete Artist & All Data
      </button>
    </div>


    <p v-if="error" class="text-danger mt-3">{{ error }}</p>
  </div>

  <div v-if="showToast" class="toast-message">
    {{ toastMessage }}
  </div>


  <div v-if="showModal" class="modal-overlay">
    <div class="modal-card">
      <h5>Are you sure?</h5>
      <p>{{ modalMessage }}</p>
      <div class="text-end">
        <button class="btn btn-secondary me-2" @click="closeModal">Cancel</button>
        <button class="btn btn-danger" @click="modalAction">Confirm</button>
      </div>
    </div>
  </div>

</template>

<style scoped>
.song-list {
  list-style: none;
  padding: 0;
  margin: 0;
  column-count: 1;
}

.song-list.two-columns {
  column-count: 2;
}

.song-row {
  break-inside: avoid;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: grab;
}

.song-row:last-child {
  border-bottom: none;
}

.view-only,
.view-only .song-row {
  cursor: default;
}

.chevron {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

.chevron-down {
  transform: rotate(45deg) translate(-1px, -1px);
}

.chevron-up {
  transform: rotate(-135deg) translate(-1px, -1px);
}
</style>
