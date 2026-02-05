<template>
  <div v-if="lineup">
    <div class="flex items-center justify-between mb-6">
      <button @click="$router.back()" class="text-gray-400 hover:text-white">
        ← Back
      </button>
      <div v-if="isOwner" class="flex items-center gap-2">
        <NuxtLink
          :to="`/lineups/${lineup.id}/edit`"
          replace
          class="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
        >
          Edit
        </NuxtLink>
        <button
          type="button"
          @click="confirmDelete"
          class="px-4 py-2 rounded-md bg-red-900/80 text-red-200 hover:bg-red-800 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Media Gallery -->
      <div class="lg:col-span-2">
        <div class="bg-gray-800 rounded-lg overflow-hidden">
          <!-- Main Media Display -->
          <div
            class="aspect-video bg-black relative overflow-hidden"
            @touchstart.passive="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
          >
            <!-- Carousel Track -->
            <div
              class="flex h-full transition-transform duration-300 ease-out"
              :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
            >
              <div
                v-for="media in sortedMedia"
                :key="media.id"
                class="w-full h-full flex-shrink-0"
              >
                <img
                  v-if="media.media_type === 'image'"
                  :src="media.url"
                  :alt="media.description || lineup.title"
                  class="w-full h-full object-contain cursor-zoom-in select-none"
                  draggable="false"
                  @click="openLightbox"
                />
                <video
                  v-else
                  :src="media.url"
                  controls
                  class="w-full h-full"
                />
              </div>
            </div>
            <div v-if="!sortedMedia.length" class="absolute inset-0 flex items-center justify-center text-gray-500">
              No media
            </div>

            <!-- Expand button (for videos and images) -->
            <button
              v-if="currentMedia"
              @click="openLightbox"
              class="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white/70 hover:text-white p-1.5 rounded transition-colors"
              title="Expand"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          </div>

          <!-- Media Description -->
          <div v-if="currentMedia?.description" class="p-4 border-t border-gray-700">
            <p class="text-gray-300">{{ currentMedia.description }}</p>
          </div>

          <!-- Thumbnails -->
          <div v-if="lineup.media?.length > 1" class="p-4 border-t border-gray-700">
            <div class="flex gap-2 overflow-x-auto">
              <button
                v-for="(media, index) in sortedMedia"
                :key="media.id"
                @click="currentIndex = index"
                class="flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-colors relative"
                :class="currentIndex === index ? 'border-red-500' : 'border-transparent'"
              >
                <img
                  v-if="media.media_type === 'image'"
                  :src="media.url"
                  class="w-full h-full object-cover"
                />
                <template v-else>
                  <video
                    :src="media.url"
                    muted
                    preload="metadata"
                    playsinline
                    class="w-full h-full object-cover pointer-events-none"
                  />
                  <span class="absolute inset-0 flex items-center justify-center bg-black/40 rounded" aria-hidden="true">
                    <svg class="w-6 h-6 text-white drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                  </span>
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Panel -->
      <div class="space-y-6">
        <div class="bg-gray-800 rounded-lg p-6">
          <h1 class="text-2xl font-bold text-white mb-4">{{ lineup.title }}</h1>

          <div class="flex flex-wrap gap-2 mb-4">
            <span v-if="agent" class="bg-red-500 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
              <img :src="agent.displayIcon" class="w-4 h-4" />
              {{ agent.displayName }}
            </span>
            <span v-if="map" class="bg-gray-700 text-white text-sm px-3 py-1 rounded">
              {{ map.displayName }}
            </span>
            <span v-if="lineup.side" class="bg-gray-700 text-white text-sm px-3 py-1 rounded capitalize">
              {{ lineup.side }}
            </span>
            <span v-if="lineup.site" class="bg-gray-700 text-white text-sm px-3 py-1 rounded">
              Site {{ lineup.site }}
            </span>
            <span v-if="abilityInfo" class="bg-gray-700 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
              <img v-if="abilityInfo.displayIcon" :src="abilityInfo.displayIcon" class="w-4 h-4" />
              {{ abilitySlotToKey(lineup.ability ?? '') }} - {{ abilityInfo.displayName }}
            </span>
          </div>

          <p v-if="lineup.description" class="text-gray-300 mb-4">
            {{ lineup.description }}
          </p>

          <div class="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
            <NuxtLink
              v-if="lineup.profile?.username"
              :to="`/profile/${lineup.profile.username}`"
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-700/50 hover:bg-gray-700 hover:text-red-400 transition-colors"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {{ lineup.profile.username }}
            </NuxtLink>
            <span v-else class="flex items-center gap-2">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              Anonymous
            </span>
            <span>{{ formatDate(lineup.created_at) }}</span>
          </div>
        </div>

        <!-- Like & Bookmark Buttons -->
        <div v-if="user" class="flex gap-3">
          <button
            @click="toggleLike"
            :disabled="likeLoading"
            class="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors"
            :class="isLiked ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" :fill="isLiked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{{ likesCount }} {{ likesCount === 1 ? 'Like' : 'Likes' }}</span>
          </button>
          <button
            @click="showBookmarkModal = true"
            class="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-colors"
            :class="isBookmarked ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>{{ bookmarksCount }} {{ bookmarksCount === 1 ? 'Bookmark' : 'Bookmarks' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-gray-400">
    Loading lineup...
  </div>

  <!-- Bookmark Modal -->
  <SaveToBookmarkModal
    :lineup-id="lineupId"
    :show="showBookmarkModal"
    @close="showBookmarkModal = false"
    @updated="refreshBookmarks"
  />

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <!-- Lightbox -->
    <div
      v-if="showLightbox && currentMedia"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      @click.self="showLightbox = false"
    >
      <button
        class="absolute top-4 right-4 text-white/70 hover:text-white z-10"
        @click="showLightbox = false"
      >
        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <img
        v-if="currentMedia.media_type === 'image'"
        :src="currentMedia.url"
        :alt="currentMedia.description || lineup!.title"
        class="max-w-[95vw] max-h-[95vh] object-contain"
      />
      <video
        v-else
        :src="currentMedia.url"
        controls
        autoplay
        class="max-w-[95vw] max-h-[95vh]"
      />
    </div>

    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60" @click="showDeleteModal = false" />
      <div class="relative bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 class="text-lg font-semibold text-white mb-2">Delete Lineup</h3>
        <p class="text-gray-400 mb-6">Are you sure you want to delete this lineup? This action cannot be undone.</p>
        <div v-if="deleteError" class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          {{ deleteError }}
        </div>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="showDeleteModal = false"
            class="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
            :disabled="deleteLoading"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="executeDelete"
            class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-2"
            :disabled="deleteLoading"
          >
            <svg v-if="deleteLoading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { LineupWithRelations } from '~/types/database.types'

const route = useRoute()
const supabase = useSupabaseClient<any>()
const user = useSupabaseUser()
const { getAgent, getMap, abilitySlotToKey } = useValorantApi()

const currentIndex = ref(0)
const likeLoading = ref(false)
const showBookmarkModal = ref(false)
const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const deleteError = ref<string | null>(null)
const showLightbox = ref(false)

const openLightbox = () => {
  if (currentMedia.value) showLightbox.value = true
}

// Touch swipe handling for gallery
const touchStartX = ref(0)
const touchEndX = ref(0)
const minSwipeDistance = 50

const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0]?.screenX ?? 0
}

const onTouchMove = (e: TouchEvent) => {
  // Prevent page scroll when swiping horizontally on gallery
  const currentX = e.changedTouches[0]?.screenX ?? 0
  const diffX = Math.abs(currentX - touchStartX.value)
  const diffY = Math.abs((e.changedTouches[0]?.screenY ?? 0) - (e.touches[0]?.screenY ?? 0))

  if (diffX > diffY && diffX > 10) {
    e.preventDefault()
  }
}

const onTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0]?.screenX ?? 0
  handleSwipe()
}

const handleSwipe = () => {
  const distance = touchStartX.value - touchEndX.value
  if (Math.abs(distance) < minSwipeDistance) return

  if (distance > 0 && currentIndex.value < sortedMedia.value.length - 1) {
    // Swipe left - next
    currentIndex.value++
  } else if (distance < 0 && currentIndex.value > 0) {
    // Swipe right - previous
    currentIndex.value--
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') showLightbox.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const lineupId = route.params.id as string

const { data: lineup } = await useAsyncData(`lineup-${lineupId}`, async () => {
  const { data } = await supabase
    .from('lineups')
    .select(`
      *,
      profile:profiles(*),
      media:lineup_media(*)
    `)
    .eq('id', lineupId)
    .single()

  return data as LineupWithRelations | null
})

const currentUserId = computed(() => (user.value as any)?.id ?? (user.value as any)?.sub)
const isOwner = computed(() => !!lineup.value && !!currentUserId.value && lineup.value.user_id === currentUserId.value)

// Fetch likes with SSR
const { data: likesData, refresh: refreshLikes } = await useAsyncData(
  `lineup-likes-${lineupId}`,
  async () => {
    if (!lineup.value) return { count: 0, isLiked: false }

    const { count } = await supabase
      .from('lineup_likes')
      .select('*', { count: 'exact', head: true })
      .eq('lineup_id', lineup.value.id)

    let isLiked = false
    if (currentUserId.value) {
      const { data } = await supabase
        .from('lineup_likes')
        .select('id')
        .eq('lineup_id', lineup.value.id)
        .eq('user_id', currentUserId.value)
        .maybeSingle()
      isLiked = !!data
    }

    return { count: count || 0, isLiked }
  },
  { watch: [currentUserId] }
)

const likesCount = computed(() => likesData.value?.count ?? 0)
const isLiked = computed(() => likesData.value?.isLiked ?? false)

// Fetch bookmarks with SSR
const { data: bookmarksData, refresh: refreshBookmarks } = await useAsyncData(
  `lineup-bookmarks-${lineupId}`,
  async () => {
    if (!lineup.value) return { count: 0, isBookmarked: false }

    // Count unique users who bookmarked this lineup (not total bookmark records)
    const { data: uniqueUsers } = await supabase
      .from('lineup_bookmarks')
      .select('user_id')
      .eq('lineup_id', lineup.value.id)

    const uniqueUserCount = new Set((uniqueUsers ?? []).map(b => b.user_id)).size

    let isBookmarked = false
    if (currentUserId.value) {
      // Check if current user has bookmarked this lineup (in any folder)
      const { data } = await supabase
        .from('lineup_bookmarks')
        .select('id')
        .eq('lineup_id', lineup.value.id)
        .eq('user_id', currentUserId.value)
        .limit(1)
      isBookmarked = !!(data && data.length > 0)
    }

    return { count: uniqueUserCount, isBookmarked }
  },
  { watch: [currentUserId] }
)

const bookmarksCount = computed(() => bookmarksData.value?.count ?? 0)
const isBookmarked = computed(() => bookmarksData.value?.isBookmarked ?? false)

function confirmDelete() {
  if (!lineup.value || !isOwner.value) return
  deleteError.value = null
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!lineup.value || !isOwner.value) return
  deleteLoading.value = true
  deleteError.value = null

  const { error } = await supabase.from('lineups').delete().eq('id', lineup.value.id)

  if (error) {
    deleteError.value = error.message
    deleteLoading.value = false
    return
  }

  await navigateTo('/profile')
}

// Fetch agent and map from Valorant API
const { data: agent } = await useAsyncData(
  `valorant-agent-${lineup.value?.agent_uuid}`,
  () => lineup.value ? getAgent(lineup.value.agent_uuid) : Promise.resolve(null),
  { watch: [lineup] }
)

const { data: map } = await useAsyncData(
  `valorant-map-${lineup.value?.map_uuid}`,
  () => lineup.value ? getMap(lineup.value.map_uuid) : Promise.resolve(null),
  { watch: [lineup] }
)

// Get ability info from agent data
const abilityInfo = computed(() => {
  if (!agent.value || !lineup.value) return null
  return agent.value.abilities.find(a => a.slot === lineup.value!.ability)
})

// Sort media by sort_order
const sortedMedia = computed(() => {
  if (!lineup.value?.media) return []
  return [...lineup.value.media].sort((a, b) => a.sort_order - b.sort_order)
})

// Default to cover media index
const coverIndex = computed(() => {
  const idx = sortedMedia.value.findIndex(m => m.is_cover)
  return idx >= 0 ? idx : 0
})
watch(coverIndex, (val) => { currentIndex.value = val }, { immediate: true })

const currentMedia = computed(() => sortedMedia.value[currentIndex.value])

const toggleLike = async () => {
  if (!currentUserId.value || !lineup.value) return

  likeLoading.value = true

  if (isLiked.value) {
    await supabase
      .from('lineup_likes')
      .delete()
      .eq('lineup_id', lineup.value.id)
      .eq('user_id', currentUserId.value)
  } else {
    await supabase
      .from('lineup_likes')
      .insert({
        lineup_id: lineup.value.id,
        user_id: currentUserId.value
      })
  }

  await refreshLikes()
  likeLoading.value = false
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
