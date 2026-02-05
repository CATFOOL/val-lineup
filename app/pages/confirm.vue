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
const user = useSupabaseUser()
const route = useRoute()
const error = ref<string | null>(null)

onMounted(() => {
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

  // @nuxtjs/supabase will automatically handle the OAuth callback
  // Just redirect if user is already set
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
