<template>
  <NuxtLink
    :to="`/collections/${collection.id}`"
    class="block bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition-all"
  >
    <div class="aspect-video bg-gray-700 relative">
      <!-- Custom cover image (priority) -->
      <img
        v-if="collection.cover_url"
        :src="getImageUrl(collection.cover_url, 'thumbnail') ?? undefined"
        class="w-full h-full object-cover"
      >
      <!-- Fallback: 2x2 grid of lineup thumbnails -->
      <div v-else-if="coverImages.length" class="w-full h-full grid grid-cols-2 grid-rows-2">
        <img
          v-for="(src, i) in coverImages"
          :key="i"
          :src="src"
          class="w-full h-full object-cover"
        >
        <!-- Fill empty slots if less than 4 -->
        <div
          v-for="n in Math.max(0, 4 - coverImages.length)"
          :key="'empty-' + n"
          class="bg-gray-700"
        />
      </div>
      <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
        <svg
          class="w-12 h-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <!-- Lineup count badge -->
      <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {{ collection.lineups_count }} {{ collection.lineups_count === 1 ? 'lineup' : 'lineups' }}
      </div>
    </div>
    <div class="p-4">
      <h3 class="text-white font-semibold mb-2 line-clamp-1">{{ collection.title }}</h3>
      <div class="flex items-center justify-between text-sm text-gray-400">
        <span
          v-if="collection.profile?.username"
          class="flex items-center gap-1.5 min-w-0 truncate"
        >
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
          {{ collection.profile.username }}
        </span>
        <span class="flex items-center gap-1 flex-shrink-0">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {{ collection.subscribers_count ?? 0 }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { CollectionWithRelations } from '~/types/database.types'
import { getImageUrl } from '~/utils/getImageUrl'

const props = defineProps<{
  collection: CollectionWithRelations & {
    cover_lineups?: { media: { url: string }[] }[]
  }
}>()

const coverImages = computed(() => {
  const lineups = props.collection.cover_lineups
  if (!lineups?.length) return []
  return lineups
    .map(l => getImageUrl(getLineupThumbnail(l.media || []), 'thumbnail'))
    .filter(Boolean)
    .slice(0, 4) as string[]
})
</script>
