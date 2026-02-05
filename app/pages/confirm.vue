<template>
  <div class="text-center py-16">
    <h1 class="text-2xl font-bold text-white mb-4">Confirming your account...</h1>
    <p class="text-gray-400">Please wait while we verify your email.</p>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/')
  }
}, { immediate: true })
</script>
