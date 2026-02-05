<template>
  <header class="bg-gray-800 border-b border-gray-700">
    <div class="container mx-auto px-4">
      <nav class="flex items-center justify-between h-16">
        <NuxtLink to="/" class="flex items-center gap-2">
          <span class="text-2xl font-bold text-red-500">VAL</span>
          <span class="text-2xl font-bold text-white">LINEUP</span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <div class="hidden md:flex items-center gap-6">
          <NuxtLink
            to="/browse"
            class="text-gray-300 hover:text-white transition-colors"
          >
            Browse
          </NuxtLink>

          <div v-if="user" class="flex items-center gap-6">
            <NuxtLink
              to="/profile"
              class="text-gray-300 hover:text-white transition-colors"
            >
              My Profile
            </NuxtLink>
            <NuxtLink
              to="/create"
              class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Create Lineup
            </NuxtLink>
            <button
              @click="signOut"
              class="ml-4 text-gray-300 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
          <div v-else>
            <NuxtLink
              to="/login"
              class="text-gray-300 hover:text-white transition-colors"
            >
              Login
            </NuxtLink>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          aria-label="Toggle menu"
        >
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </nav>

      <!-- Mobile Navigation -->
      <div
        v-show="mobileMenuOpen"
        class="md:hidden border-t border-gray-700 py-4 space-y-3"
      >
        <NuxtLink
          to="/browse"
          class="block text-gray-300 hover:text-white transition-colors py-2"
          @click="mobileMenuOpen = false"
        >
          Browse
        </NuxtLink>

        <template v-if="user">
          <NuxtLink
            to="/profile"
            class="block text-gray-300 hover:text-white transition-colors py-2"
            @click="mobileMenuOpen = false"
          >
            My Profile
          </NuxtLink>
          <NuxtLink
            to="/create"
            class="block bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors text-center"
            @click="mobileMenuOpen = false"
          >
            Create Lineup
          </NuxtLink>
          <button
            @click="signOut(); mobileMenuOpen = false"
            class="block w-full text-left text-gray-300 hover:text-white transition-colors py-2"
          >
            Logout
          </button>
        </template>
        <template v-else>
          <NuxtLink
            to="/login"
            class="block text-gray-300 hover:text-white transition-colors py-2"
            @click="mobileMenuOpen = false"
          >
            Login
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const mobileMenuOpen = ref(false)
const route = useRoute()

// Close mobile menu on route change
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})

const signOut = async () => {
  await supabase.auth.signOut()
  navigateTo('/')
}
</script>
