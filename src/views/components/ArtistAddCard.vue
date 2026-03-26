<script setup>
import { ref } from 'vue'
import { db } from '@/firebaseClient'
import { collection, addDoc } from 'firebase/firestore'

const emit = defineEmits(['cancel', 'added'])

const props = defineProps({
  memberUid: { type: String, required: true },
  theme: { type: Object, default: null },
})

const artistName = ref('')
const error = ref('')

const submitArtist = async () => {
  error.value = ''

  if (!artistName.value.trim()) {
    error.value = 'Please enter an artist name.'
    return
  }

  await addDoc(collection(db, 'members', props.memberUid, 'artists'), {
    name: artistName.value.trim(),
  })
  emit('added')
}
</script>

<template>
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5);">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content p-4" :style="{ backgroundColor: theme?.light_one, color: theme?.dark_one }">
        <h4 class="mb-3" :style="{ color: theme?.dark_one }">Add New Artist</h4>

        <div class="mb-3">
          <label class="form-label" :style="{ color: theme?.dark_one }">Artist Name:</label>
          <input v-model="artistName" type="text" class="form-control" placeholder="e.g. Taylor Swift"
            :style="{ backgroundColor: theme?.light_two, color: theme?.dark_one, borderColor: theme?.dark_two }" />
        </div>

        <div class="d-flex justify-content-between">
          <button class="btn" :style="{ borderColor: theme?.dark_one, color: theme?.dark_one }"
            @click="$emit('cancel')">Cancel</button>
          <button class="btn" :style="{ backgroundColor: theme?.dark_two, color: theme?.light_one }"
            @click="submitArtist">Add Artist</button>
        </div>

        <div v-if="error" class="text-danger mt-3">{{ error }}</div>
      </div>
    </div>
  </div>
</template>
