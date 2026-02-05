<template>
  <div class="text-center py-16">
    <h1 class="text-2xl font-bold text-white mb-4">
      {{ error ? 'Authentication Error' : 'Confirming your account...' }}
    </h1>
    <p v-if="error" class="text-red-400 mb-4">{{ error }}</p>
    <p v-else class="text-gray-400">Please wait while we verify your email.</p>
    <NuxtLink v-if="error" to="/login" class="text-val-red hover:underline">
      Back to login
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const error = ref<string | null>(null)

onMounted(async () => {
  // Check for errors in query params
  const errorCode = route.query.error_code as string
  const errorDescription = route.query.error_description as string

  if (errorCode || errorDescription) {
    if (errorDescription?.includes('already registered')) {
      error.value = 'This email is already registered. Please login with your original method.'
    } else {
      error.value = errorDescription || 'Authentication failed'
    }
    return
  }

  // Handle OAuth PKCE callback - exchange code for session
  const code = route.query.code as string
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      error.value = exchangeError.message
      return
    }
  }

  // Handle OAuth implicit callback - extract session from URL hash
  const hash = window.location.hash
  if (hash && hash.includes('access_token')) {
    const { error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      error.value = sessionError.message
      return
    }
  }

  // Redirect if user is set
  if (user.value) {
    navigateTo('/')
  }
})

watch(user, (newUser) => {
  if (newUser && !error.value) {
    navigateTo('/')
  }
}, { immediate: true })
</script>
