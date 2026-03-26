<script setup>
import { ref, onMounted, onBeforeMount, onBeforeUnmount } from 'vue'
import { auth } from '@/firebaseClient'
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { useStore } from "vuex"

import ArgonInput from "@/components/ArgonInput.vue"
import ArgonSwitch from "@/components/ArgonSwitch.vue"
import ArgonButton from "@/components/ArgonButton.vue"

const store = useStore()
const router = useRouter()

const email = ref('')
const premail = ref('')
const password = ref('')
const errorMessage = ref('')
const passwordResetRequest = ref(false)

// Hide navbar/footer/etc while on auth page
onBeforeMount(() => {
  store.state.layout = 'auth'
  store.state.showNavbar = false
})
onBeforeUnmount(() => {
  store.state.layout = 'default'
  store.state.showNavbar = true
})

onMounted(() => {
  const currentUser = store.state.user || auth.currentUser
  if (currentUser) {
    router.push(`/members/${currentUser.uid}/tables`)
  }
})

const signIn = async () => {
  errorMessage.value = ''
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    store.commit('setUser', user)
    const hasMember = await store.dispatch('fetchMember', user.uid)
    await router.push(hasMember ? `/members/${user.uid}/tables` : '/create-member')
  } catch (err) {
    errorMessage.value = err.message
  }
}

const resetPassword = async () => {
  errorMessage.value = ''
  try {
    await sendPasswordResetEmail(auth, premail.value)
    passwordResetRequest.value = false
    alert("Check your email for a reset link.")
  } catch (err) {
    errorMessage.value = err.message
  }
}
</script>

<template>
  <main class="mt-0 main-content">
    <section>
      <div class="page-header min-vh-100">
        <div class="container">
          <div class="row">

            <div v-if="!passwordResetRequest" class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0">
              <div class="card card-plain">
                <div class="pb-0 card-header text-start">
                  <h4 class="font-weight-bolder">Sign In</h4>
                  <p class="mb-0">Enter your email and password to sign in</p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent="signIn">
                    <div class="mb-3">
                      <argon-input v-model="email" id="email" type="email" placeholder="email" name="email" size="lg" />
                    </div>
                    <div class="mb-3">
                      <argon-input v-model="password" id="password" type="password" placeholder="Password"
                        name="password" size="lg" />
                    </div>
                    <argon-switch id="rememberMe" name="remember-me">Remember me</argon-switch>

                    <div class="text-center">
                      <argon-button class="custom-login-btn mt-4" fullWidth size="lg">Sign in</argon-button>
                    </div>

                    <div v-if="errorMessage" class="text-danger mt-2 text-sm">
                      {{ errorMessage }}
                    </div>

                    <div class="pt-3">
                      <p>
                        Don't have an account?
                        <router-link @click="resetPassword" to="/signup" class="text-primary fw-bold">Sign
                          Up!</router-link>
                      </p>
                    </div>

                    <div>
                      <p>
                        Forgot Password?
                        <span @click="passwordResetRequest = true" class="text-primary fw-bold pointer">Reset</span>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div v-else-if="passwordResetRequest" class="mx-auto col-xl-4 col-lg-5 col-md-7 d-flex flex-column mx-lg-0">
              <div class="card card-plain">
                <div class="pb-0 card-header text-start">
                  <h4 class="font-weight-bolder">Password Reset</h4>
                  <p class="mb-0">Enter your email to receive a password reset link</p>
                </div>
                <div class="card-body">
                  <form role="form" @submit.prevent="resetPassword">
                    <div class="mb-3">
                      <argon-input v-model="premail" id="premail" type="premail" placeholder="email" name="premail"
                        size="lg" />
                    </div>

                    <div class="text-center">
                      <argon-button class="custom-login-btn mt-4" fullWidth size="lg">Send Password Reset
                        Email</argon-button>
                    </div>

                    <div v-if="errorMessage" class="text-danger mt-2 text-sm">
                      {{ errorMessage }}
                    </div>

                    <div class="mt-4">
                      <p>
                        <span @click="passwordResetRequest = false" class="text-primary fw-bold pointer">Back</span>
                      </p>
                    </div>

                  </form>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.custom-login-btn {
  background: linear-gradient(135deg, #aa28c1, #6834c9);
  color: white;
  border: none;
}

.custom-login-btn:hover {
  opacity: 0.95;
}

.pointer {
  cursor: pointer;
}
</style>
