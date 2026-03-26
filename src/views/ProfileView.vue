<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useStore } from 'vuex';
import { auth, db } from '@/firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';
import ArgonInput from '@/components/ArgonInput.vue';
import { useRouter } from 'vue-router'
import { themes as themeConfig } from '@/themes'

const store = useStore();
const router = useRouter()

const user = computed(() => store.state.user);
const member = computed(() => store.state.member);
const theme = computed(() => store.state.theme);

const themes = ref([]);
const showDeleteConfirm = ref(false)
const selectedThemeId = ref(0);
const updatedName = ref('');
const success = ref('');
const error = ref('');
const isPrivate = ref(false);

watch(member, (newMember) => {
  if (newMember) {
    updatedName.value = newMember.member_name;
    selectedThemeId.value = newMember.theme_id ?? 0;
    isPrivate.value = newMember.is_private || false;
  }
}, { immediate: true });

onMounted(async () => {
  store.state.isAbsolute = true;
  store.state.imageLayout = 'profile-overview';
  store.state.showFooter = true;
  store.state.hideConfigButton = true;
  document.body.classList.add('profile-overview');

  if (!user.value) {
    await auth.authStateReady()
    if (auth.currentUser) {
      store.commit('setUser', auth.currentUser)
    }
  }

  themes.value = Object.values(themeConfig)
});

onBeforeUnmount(() => {
  store.state.isAbsolute = false;
  document.body.classList.remove('profile-overview');
});

const submitChanges = async () => {
  error.value = '';
  success.value = '';
  try {
    const memberData = {
      member_name: updatedName.value.trim(),
      theme_id: selectedThemeId.value,
      is_private: isPrivate.value,
    }
    await updateDoc(doc(db, 'members', auth.currentUser.uid), memberData)
    store.commit('setMember', memberData)
    success.value = 'Profile updated!'
  } catch (err) {
    error.value = err.message
  }
};

const openDeleteModal = () => {
  showDeleteConfirm.value = true;
};

const deleteConfirmed = async () => {
  // TODO: delete all user data from Firestore once artists/albums/songs are implemented
  await store.dispatch('logout')
  router.push('/signin')
};
</script>



<template>
  <main>
    <div class="container-fluid">
      <div class="page-header min-height-250" :style="{
        backgroundImage: theme?.header ? `url(${theme.header})` : '',
        backgroundSize: 'cover',
        backgroundPosition: theme?.header_position || 'center',
        marginRight: '-24px',
        marginLeft: '-34%',
        marginTop: '-5%',
        position: 'relative',
      }">
      </div>

      <div class="card shadow-lg mt-n8" :style="{ backgroundColor: theme?.light_one || '#f5f5f5' }">
        <div class="card-body p-3 d-inline-flex justify-content-between">
          <div class="h-100 px-4">
            <h5 class="mb-1" :style="{ color: theme?.dark_one }">{{ member?.member_name || '...' }}</h5>
            <p class="mb-0 font-weight-bold text-sm" :style="{ color: theme?.dark_one }">Customize your profile and theme</p>
          </div>
          <div>
            <button class="btn"
              :style="{ backgroundColor: theme?.dark_two || '#495057', color: theme?.light_one || '#fff' }"
              @click="openDeleteModal">
              Delete My Account
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="py-4 container-fluid">
      <div class="card" :style="{ backgroundColor: theme?.light_one || '#f5f5f5' }">
        <div class="card-body">

          <div class="row">
            <div class="col-md-6">
              <label class="form-control-label" :style="{ color: theme?.dark_one }">Username</label>
              <argon-input v-model="updatedName" type="text" />
            </div>
          </div>

          <hr class="horizontal dark" />

          <div class="col-md-6 mt-3">
            <label class="form-control-label" :style="{ color: theme?.dark_one }">Public/Private Profile</label>
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="privateSwitch" v-model="isPrivate" />
              <label class="form-check-label" :style="{ color: theme?.dark_one }" for="privateSwitch">
                {{ isPrivate ? 'Your profile is hidden from others' : 'Your profile is visible to others' }}
              </label>
            </div>
          </div>

          <hr class="horizontal dark" />

          <div>
            <p class="text-uppercase text-sm" :style="{ color: theme?.dark_one }">Choose Your Theme</p>
            <div class="d-flex flex-wrap gap-3">
              <div v-for="t in themes" :key="t.id" class="text-center" style="cursor: pointer" @click="selectedThemeId = t.id">
                <div :class="['theme-circle', selectedThemeId === t.id ? 'border border-dark border-3' : '']">
                  <img
                    :src="t.image"
                    class="img-fluid rounded-circle"
                    style="width: 70px; height: 70px; object-fit: cover"
                    :alt="t.name"
                  />
                </div>
                <small class="d-block mt-2" :style="{ color: theme?.dark_one }">{{ t.name }}</small>
              </div>
            </div>
          </div>

          <div class="text-end mt-4">
            <button class="btn ombre-overlay"
              :style="{ backgroundColor: theme?.dark_two || '#495057', color: theme?.light_one || '#fff' }"
              @click="submitChanges">Update Profile</button>
          </div>
          <div v-if="error" class="text-danger mt-3">{{ error }}</div>
          <div v-if="success" class="text-success mt-3">{{ success }}</div>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="modal-card">
        <h5>Are you sure?</h5>
        <p>This will permanently delete your account and all data.</p>
        <div class="text-end">
          <button class="btn btn-secondary me-2" @click="showDeleteConfirm = false">Cancel</button>
          <button class="btn btn-danger" @click="deleteConfirmed">Delete Everything</button>
        </div>
      </div>
    </div>

  </main>
</template>

<style scoped>
.theme-circle {
  display: inline-block;
  border-radius: 50%;
  padding: 4px;
  transition: border 0.2s ease-in-out;
}
</style>
