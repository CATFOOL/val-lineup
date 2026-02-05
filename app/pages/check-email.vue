<template>
  <div class="min-h-[80vh] flex items-center justify-center">
    <div class="w-full max-w-md text-center">
      <!-- Icon -->
      <div class="mb-6">
        <div class="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      <!-- Card -->
      <div class="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
        <h1 class="text-2xl font-bold text-white mb-4">Check your email</h1>

        <p class="text-gray-400 mb-6">
          We've sent a confirmation link to
          <span v-if="email" class="text-white font-medium block mt-1">{{ email }}</span>
        </p>

        <p class="text-gray-500 text-sm mb-6">
          Click the link in the email to activate your account. If you don't see the email, check your spam folder.
        </p>

        <div class="space-y-3">
          <NuxtLink
            to="/login"
            class="block w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Login
          </NuxtLink>

          <button
            @click="resendEmail"
            :disabled="resending || cooldown > 0"
            class="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors"
          >
            <span v-if="resending">Sending...</span>
            <span v-else-if="cooldown > 0">Resend in {{ cooldown }}s</span>
            <span v-else>Resend confirmation email</span>
          </button>
        </div>

        <div v-if="message" class="mt-4 p-3 rounded-lg" :class="messageType === 'success' ? 'bg-green-500/10 border border-green-500/50' : 'bg-red-500/10 border border-red-500/50'">
          <p :class="messageType === 'success' ? 'text-green-400' : 'text-red-400'" class="text-sm">{{ message }}</p>
        </div>
      </div>

      <!-- Back to register -->
      <p class="mt-6 text-gray-500 text-sm">
        Wrong email?
        <NuxtLink to="/register" class="text-red-500 hover:text-red-400">
          Register again
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest'
})

const route = useRoute()
const supabase = useSupabaseClient()

const email = ref(route.query.email as string || '')
const resending = ref(false)
const cooldown = ref(0)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

let cooldownTimer: ReturnType<typeof setInterval> | null = null

const resendEmail = async () => {
  if (!email.value || cooldown.value > 0) return

  resending.value = true
  message.value = ''

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.value
  })

  resending.value = false

  if (error) {
    message.value = error.message
    messageType.value = 'error'
  } else {
    message.value = 'Confirmation email sent!'
    messageType.value = 'success'

    // Start cooldown
    cooldown.value = 60
    cooldownTimer = setInterval(() => {
      cooldown.value--
      if (cooldown.value <= 0 && cooldownTimer) {
        clearInterval(cooldownTimer)
      }
    }, 1000)
  }
}

onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer)
  }
})
</script>
