<template>
  <div class="min-h-[80vh] flex items-center justify-center">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="flex justify-center text-4xl font-bold gap-2">
          <span class="text-red-500">VAL</span>
          <span class="text-white">LINEUP</span>
        </h1>
        <p class="text-gray-400 mt-2">Create your account</p>
      </div>

      <!-- Card -->
      <div class="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
        <!-- OAuth Buttons -->
        <div class="space-y-3 mb-6">
          <button
            @click="signInWithGoogle"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:bg-gray-300 text-gray-900 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            @click="signInWithDiscord"
            :disabled="loading"
            class="w-full flex items-center justify-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Continue with Discord
          </button>
        </div>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-gray-800/50 text-gray-400">or register with email</span>
          </div>
        </div>


        <!-- Email Form -->
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Username</label>
            <input
              v-model="username"
              type="text"
              required
              class="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border transition-colors focus:outline-none"
              :class="usernameError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : usernameAvailable ? 'border-green-500 focus:border-green-500 focus:ring-1 focus:ring-green-500' : 'border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500'"
              placeholder="Your Username"
            />
            <p v-if="usernameChecking" class="text-gray-400 text-xs mt-1">Checking...</p>
            <p v-else-if="usernameError" class="text-red-400 text-xs mt-1">{{ usernameError }}</p>
            <p v-else-if="usernameAvailable" class="text-green-400 text-xs mt-1">Username is available</p>
          </div>

          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-colors"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label class="block text-gray-300 text-sm font-medium mb-2">Password</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="6"
              class="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:outline-none transition-colors"
              placeholder="At least 6 characters"
            />
          </div>

          <!-- Error/Success Messages -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p class="text-red-400 text-sm">{{ error }}</p>
          </div>

          <div v-if="success" class="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
            <p class="text-green-400 text-sm">{{ success }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading || !!usernameError || usernameChecking"
            class="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Creating account...
            </span>
            <span v-else>Create Account</span>
          </button>
        </form>

        <!-- Login Link -->
        <p class="mt-6 text-center text-gray-400">
          Already have an account?
          <NuxtLink to="/login" class="text-red-500 hover:text-red-400 font-medium">
            Sign in
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const supabase = useSupabaseClient()

const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const usernameError = ref('')
const usernameAvailable = ref(false)
const usernameChecking = ref(false)

let usernameCheckTimer: ReturnType<typeof setTimeout> | null = null
watch(username, (val) => {
  usernameAvailable.value = false
  usernameError.value = ''
  if (usernameCheckTimer) clearTimeout(usernameCheckTimer)
  const trimmed = val.trim()
  if (!trimmed) return
  if (trimmed.length < 2) {
    usernameError.value = 'Username must be at least 2 characters'
    return
  }
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
    usernameError.value = 'Only letters, numbers, underscores and hyphens allowed'
    return
  }
  usernameChecking.value = true
  usernameCheckTimer = setTimeout(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .single()
    usernameChecking.value = false
    if (data) {
      usernameError.value = 'Username is already taken'
    } else {
      usernameAvailable.value = true
    }
  }, 400)
})

const signInWithGoogle = async () => {
  loading.value = true
  error.value = ''

  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/confirm`
    }
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
  }
}

const signInWithDiscord = async () => {
  loading.value = true
  error.value = ''

  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/confirm`
    }
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
  }
}

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  if (usernameError.value || usernameChecking.value) {
    error.value = usernameError.value || 'Please wait for username check'
    loading.value = false
    return
  }

  const { data, error: authError } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        username: username.value
      }
    }
  })

  if (authError) {
    if (authError.message === 'User already registered') {
      error.value = 'This email is already registered. Please sign in instead.'
    } else {
      error.value = authError.message
    }
    loading.value = false
    return
  }

  // 如果有 session，说明不需要邮箱确认，直接跳转首页
  if (data.session) {
    navigateTo('/')
  } else {
    // 需要邮箱确认，跳转到确认页面
    navigateTo(`/check-email?email=${encodeURIComponent(email.value)}`)
  }
}
</script>
