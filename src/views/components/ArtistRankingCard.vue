<script setup>
import { ref, watchEffect, computed } from 'vue'
import draggable from 'vuedraggable'
import { db } from '@/firebaseClient'
import { doc, getDoc, getDocs, updateDoc, collection, query, orderBy } from 'firebase/firestore'

const props = defineProps({
    theme: Object,
    isOwner: Boolean,
    memberId: String,
    artistId: String,
})

const editing = ref(false)
const expanded = ref(false)
const allSongs = ref([])
const rankedList = ref([])
const albums = ref([])
const error = ref(null)
const showConfirmReset = ref(false)

const artistRef = () => doc(db, 'members', props.memberId, 'artists', props.artistId)

const fetchSongsAndAlbums = async () => {
    if (!props.memberId || !props.artistId) return

    const [albumsSnap, artistSnap] = await Promise.all([
        getDocs(query(collection(db, 'members', props.memberId, 'artists', props.artistId, 'albums'), orderBy('rank'))),
        getDoc(artistRef()),
    ])

    const rankedIds = artistSnap.data()?.ranked_song_ids || []

    albums.value = albumsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        songs: (d.data().songs || []).map((song, idx) => ({
            ...song,
            album_ranking: idx + 1,
            artist_ranking: rankedIds.includes(song.id) ? rankedIds.indexOf(song.id) + 1 : null,
            albums: { title: d.data().title },
        })),
    }))

    const songMap = {}
    albums.value.forEach(album => album.songs.forEach(song => { songMap[song.id] = song }))

    allSongs.value = Object.values(songMap)
    rankedList.value = rankedIds.filter(id => songMap[id]).map(id => songMap[id])
}

watchEffect(() => {
    if (expanded.value) fetchSongsAndAlbums()
})

const unrankedTopSongsPerAlbum = computed(() => {
    return albums.value.map(album => ({
        ...album,
        topSongs: album.songs
            .filter(song => song.artist_ranking == null)
            .sort((a, b) => a.album_ranking - b.album_ranking)
            .slice(0, 2),
    })).filter(album => album.topSongs.length > 0)
})

const saveRankedIds = async (ids) => {
    await updateDoc(artistRef(), { ranked_song_ids: ids })
    await fetchSongsAndAlbums()
}

const addSongToRanking = async (song) => {
    const snap = await getDoc(artistRef())
    const ids = snap.data()?.ranked_song_ids || []
    if (!ids.includes(song.id)) await saveRankedIds([...ids, song.id])
}

const removeSongFromRanking = async (song) => {
    const snap = await getDoc(artistRef())
    await saveRankedIds((snap.data()?.ranked_song_ids || []).filter(id => id !== song.id))
}

const updateSongOrder = async () => {
    await updateDoc(artistRef(), { ranked_song_ids: rankedList.value.map(s => s.id) })
    await fetchSongsAndAlbums()
}

const performResetRanking = async () => {
    await updateDoc(artistRef(), { ranked_song_ids: [] })
    await fetchSongsAndAlbums()
    showConfirmReset.value = false
}

const confirmReset = () => { showConfirmReset.value = true }
const cancelReset = () => { showConfirmReset.value = false }
</script>

<template>
    <div v-if="theme" class="card my-4"
        :style="{ backgroundColor: theme.light_one, color: theme.dark_one, border: '1px solid ' + (theme.dark_one || '#000') + '44' }">

        <!-- Card Header -->
        <div class="card-header d-flex align-items-center justify-content-between py-2 px-3"
            :style="{ backgroundColor: theme.light_two, color: theme.dark_one, border: 'none', borderBottom: '1px solid ' + (theme.dark_one || '#000') + '22' }">

            <h6 class="mb-0 fw-semibold" :style="{ color: theme.dark_one }">Entire Ranked Discography</h6>

            <div class="d-flex align-items-center gap-2">
                <!-- Edit mode: reset + done -->
                <template v-if="editing && props.isOwner">
                    <button class="btn btn-sm px-2 py-1"
                        :style="{ color: theme.dark_one, border: '1px solid ' + theme.dark_one }"
                        @click="confirmReset">
                        Reset
                    </button>
                    <button class="btn btn-sm px-2 py-1"
                        :style="{ backgroundColor: theme.dark_two, color: theme.light_one }"
                        @click="editing = false">
                        Done
                    </button>
                </template>

                <!-- Expanded, view mode: edit rankings button -->
                <button v-else-if="expanded && props.isOwner" class="btn btn-sm px-2 py-1"
                    :style="{ backgroundColor: theme.dark_two, color: theme.light_one }"
                    @click="editing = true">
                    Edit Rankings
                </button>

                <!-- Expand / collapse toggle (always visible) -->
                <button class="btn btn-sm px-2 py-1 d-flex align-items-center justify-content-center"
                    style="width: 30px; height: 28px;"
                    :style="{ color: theme.dark_one, border: '1px solid ' + theme.dark_one }"
                    @click="expanded = !expanded">
                    <span class="chevron" :class="expanded ? 'chevron-up' : 'chevron-down'"></span>
                </button>
            </div>
        </div>

        <!-- Expanded body -->
        <div v-if="expanded" class="card-body py-2 px-3">

            <!-- Draggable ranked list (edit mode) -->
            <draggable v-if="editing && props.isOwner" v-model="rankedList" item-key="id" tag="ul"
                class="ranked-list mb-0" @end="updateSongOrder">
                <template #item="{ element: song, index }">
                    <li class="ranked-row d-flex align-items-center px-1 py-1"
                        :style="{ color: theme.dark_one }">
                        <button class="btn btn-sm btn-link text-danger p-0 lh-1 me-2" style="font-size: 0.8rem;"
                            @click="removeSongFromRanking(song)" title="Remove">×</button>
                        <span class="text-muted me-2" style="font-size: 0.8rem; min-width: 1.5rem;">#{{ index + 1 }}</span>
                        <span class="flex-grow-1" style="font-size: 0.9rem;">{{ song.title }}</span>
                        <span style="font-size: 0.78rem; opacity: 0.6;">{{ song.albums.title }}</span>
                    </li>
                </template>
            </draggable>

            <!-- Read-only ranked list -->
            <ul v-else class="ranked-list mb-0 view-only">
                <li v-if="rankedList.length === 0" class="ranked-row px-1 py-2 text-center"
                    :style="{ color: theme.dark_one + '88' }">
                    No songs ranked yet.
                </li>
                <li v-for="(song, index) in rankedList" :key="song.id"
                    class="ranked-row d-flex align-items-center px-1 py-1 view-only"
                    :style="{ color: theme.dark_one }">
                    <span class="text-muted me-2" style="font-size: 0.8rem; min-width: 1.5rem;">#{{ index + 1 }}</span>
                    <span class="flex-grow-1" style="font-size: 0.9rem;">{{ song.title }}</span>
                    <span style="font-size: 0.78rem; opacity: 0.6;">{{ song.albums.title }}</span>
                </li>
            </ul>

            <!-- Add from albums (edit mode) -->
            <div v-if="editing && props.isOwner" class="mt-4">
                <h6 class="mb-3 fw-semibold" :style="{ color: theme.dark_one }">Add from Albums</h6>
                <div class="d-flex flex-wrap gap-3">
                    <div v-for="album in unrankedTopSongsPerAlbum" :key="album.id" class="card"
                        :style="{ backgroundColor: theme.light_two, color: theme.dark_one, border: '1px solid ' + (theme.dark_one || '#000') + '22', minWidth: '180px', maxWidth: '220px' }">
                        <div class="card-header py-1 px-3"
                            :style="{ backgroundColor: theme.light_two, borderBottom: '1px solid ' + (theme.dark_one || '#000') + '22', border: 'none' }">
                            <strong style="font-size: 0.85rem;" :style="{ color: theme.dark_one }">{{ album.title }}</strong>
                        </div>
                        <ul class="list-unstyled mb-0 px-2 py-1">
                            <li v-for="song in album.topSongs" :key="song.id"
                                class="d-flex justify-content-between align-items-center py-1">
                                <span style="font-size: 0.82rem;" :style="{ color: theme.dark_one }">#{{ song.album_ranking }} — {{ song.title }}</span>
                                <button class="btn btn-sm p-0 ms-2 d-flex align-items-center justify-content-center"
                                    style="width: 20px; height: 20px; font-size: 0.85rem; border-radius: 50%; flex-shrink: 0;"
                                    :style="{ backgroundColor: theme.dark_two, color: theme.light_one }"
                                    @click="addSongToRanking(song)">+</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>

        <p v-if="error" class="text-danger m-3">{{ error }}</p>
    </div>

    <!-- Reset confirm modal -->
    <div v-if="showConfirmReset" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
            <div class="modal-content" :style="{ backgroundColor: theme.light_two, color: theme.dark_one }">
                <div class="modal-header">
                    <h5 class="modal-title" :style="{ color: theme.dark_one }">Confirm Reset</h5>
                    <button type="button" class="btn-close" @click="cancelReset"></button>
                </div>
                <div class="modal-body">
                    <p>This will remove all song rankings for this artist. Are you sure?</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="cancelReset">Cancel</button>
                    <button class="btn btn-danger" @click="performResetRanking">Confirm Reset</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.ranked-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.ranked-row {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    cursor: grab;
}

.ranked-row:last-child {
    border-bottom: none;
}

.view-only,
.view-only .ranked-row {
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
