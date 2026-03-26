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

    // Build albums with songs annotated with album_ranking and album title
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

    // Build a flat song map for quick lookup
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
            .slice(0, 3),
    }))
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
    <div v-if="theme" class="card pb-3 my-4" :style="{ backgroundColor: theme.light_two, color: theme.dark_one }">
        <div class="card-header d-flex justify-content-between align-items-center"
            :style="{ backgroundColor: theme.light_two, color: theme.dark_one }">
            <h5 class="mb-0" v-if="!expanded || (expanded && $screen?.mdAndUp)">
                Entire Ranked Discography
            </h5>
            <div>
                <button v-if="!editing && props.isOwner && expanded" class="btn btn-sm me-2"
                    :style="{ backgroundColor: theme.dark_two, color: theme.light_two }" @click="editing = true">
                    I'm Ready to Rank
                </button>
                <button v-if="editing && props.isOwner && expanded" class="btn btn-sm ms-2 mx-2"
                    :style="{ backgroundColor: theme.dark_two, color: theme.light_two }" @click="confirmReset">
                    Reset Ranking
                </button>

                <button v-if="editing && props.isOwner && expanded" class="btn btn-sm"
                    :style="{ backgroundColor: theme.dark_two, color: theme.light_two }" @click="editing = false">
                    Done Ranking
                </button>
                <button v-if="!editing" class="btn btn-sm ombre-overlay fs-6"
                    :style="{ backgroundColor: theme.dark_two, color: theme.light_two }" @click="expanded = !expanded">
                    {{ expanded ? '-' : '+' }}
                </button>
            </div>
        </div>
        <div v-if="expanded" class="card-body" :style="{ backgroundColor: theme.light_two, color: theme.dark_one }">
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <!-- Hide album column on small screens -->
                        <th class="d-none d-sm-table-cell">Album</th>
                    </tr>
                </thead>

                <!-- Editable Draggable Rows -->
                <draggable v-if="editing && props.isOwner" v-model="rankedList" item-key="id" tag="tbody"
                    @end="updateSongOrder">
                    <template #item="{ element: song, index }">
                        <tr>

                            <td>
                                <button v-if="editing && props.isOwner"
                                    class="btn btn-sm btn-outline-danger py-0 px-2 mx-2 my-auto" style="font-size: 0.75rem;"
                                    @click="removeSongFromRanking(song)" title="Remove from ranked list">
                                     - 
                                </button>{{ index + 1 }}
                            </td>
                            <td class="d-flex justify-content-between align-items-center w-100">
                                <span>{{ song.title }}</span>
                            </td>

                            <!-- Album name (mobile hidden) -->
                            <td class="d-none d-sm-table-cell">
                                {{ song.albums.title }}
                            </td>
                        </tr>
                    </template>
                </draggable>

                <!-- Read-only view -->
                <tbody v-else class="view-only">
                    <tr v-if="rankedList.length === 0">
                        <td colspan="3" class="text-center view-only text-muted py-3">
                            No songs ranked yet.
                        </td>
                    </tr>
                    <tr v-for="(song, index) in rankedList" :key="song.id" class="view-only">
                        <td>{{ index + 1 }}</td>
                        <td>
                            {{ song.title }}
                            <div class="text-muted small d-sm-none">
                                {{ song.albums.title }}
                            </div>
                        </td>
                        <td class="d-none d-sm-table-cell">
                            {{ song.albums.title }}
                        </td>
                    </tr>
                </tbody>
            </table>


            <!-- Ranking Section -->
            <div v-if="editing && props.isOwner">
                <h6 class="mt-4 mb-2">Top Unranked Songs Per Album</h6>
                <div class="d-flex flex-wrap gap-3">
                    <div v-for="album in unrankedTopSongsPerAlbum" :key="album.id" class="card small-album-card"
                        :style="{ backgroundColor: theme.light_two, color: theme.dark_one, minWidth: '200px', maxWidth: '240px' }">
                        <div class="card-header py-2 px-3">
                            <strong>{{ album.title }}</strong>
                        </div>
                        <ul class="list-group list-group-flush h-100">
                            <li v-for="(song, index) in album.topSongs" :key="song.id"
                                class="list-group-item d-flex justify-content-between align-items-center py-1 px-2 h-100"
                                :class="{ 'text-muted': index === 2, 'bg-light': index === 2 }">
                                <span style="font-size: 0.85rem;">#{{ song.album_ranking }} - {{ song.title }}</span>
                                <button v-if="index < 2" class="btn btn-sm btn-outline-success my-auto py-0 px-2"
                                    style="font-size: 0.75rem;" @click="addSongToRanking(song)">
                                    +
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>

        <p v-if="error" class="text-danger m-3">{{ error }}</p>
    </div>

    <div v-if="showConfirmReset" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
        <div class="modal-dialog">
            <div class="modal-content" :style="{ backgroundColor: theme.light_two, color: theme.dark_one }">
                <div class="modal-header">
                    <h5 class="modal-title">Confirm Reset</h5>
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
.bg-light {
    opacity: 0.5;
    transition: opacity 0.3s ease-in;
}

.draggable-fade-enter-active,
.draggable-fade-leave-active {
    transition: opacity 0.2s;
}

.draggable-fade-enter-from,
.draggable-fade-leave-to {
    opacity: 0;
}

tr {
    cursor: grab;
}

.modal {
    z-index: 1055;
}

.modal-content {
    border-radius: 0.5rem;
}

.view-only {
  cursor: default;
}
</style>
