<template>
  <NuxtLink
    :to="`/lineups/${lineup.id}`"
    class="block bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition-all"
  >
    <div class="aspect-video bg-gray-700 relative">
      <!-- Image thumbnail -->
      <img
        v-if="firstMedia?.media_type === 'image'"
        :src="getImageUrl(firstMedia.url, 'thumbnail') ?? undefined"
        :alt="lineup.title"
        class="w-full h-full object-cover"
      />
      <!-- Video preview (first frame) -->
      <video
        v-else-if="firstMedia?.media_type === 'video'"
        :src="firstMedia.url"
        muted
        preload="metadata"
        playsinline
        class="w-full h-full object-cover pointer-events-none"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
        No Image
      </div>
      <div class="absolute top-2 left-2 flex gap-2">
        <span v-if="agent" class="bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <img :src="agent.displayIcon" class="w-4 h-4" />
          {{ agent.displayName }}
        </span>
        <span v-if="map" class="bg-gray-900/80 text-white text-xs px-2 py-1 rounded">
          {{ map.displayName }}
        </span>
      </div>
      <div v-if="lineup.side || lineup.site" class="absolute bottom-2 right-2 flex gap-1.5">
        <span
          v-if="lineup.side"
          class="text-xs font-medium px-2 py-0.5 rounded capitalize bg-black/70"
          :class="sideColor"
        >
          {{ lineup.side }}
        </span>
        <span
          v-if="lineup.site"
          class="text-xs font-medium px-2 py-0.5 rounded bg-black/70"
          :class="siteColor"
        >
          {{ lineup.site === 'Mid' ? 'Mid' : `Site ${lineup.site}` }}
        </span>
      </div>
    </div>
    <div class="p-4">
      <h3 class="text-white font-semibold mb-2 line-clamp-1">{{ lineup.title }}</h3>
      <div class="flex items-center justify-between text-sm text-gray-400">
        <span
          v-if="lineup.profile?.username"
          class="flex items-center gap-1.5 hover:text-red-400 transition-colors cursor-pointer min-w-0 truncate"
          @click.prevent.stop="navigateTo(`/profile/${lineup.profile.username}`)"
        >
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          {{ lineup.profile.username }}
        </span>
        <span v-else class="flex items-center gap-1.5 min-w-0 truncate">
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          Anonymous
        </span>
        <span class="flex items-center gap-1 flex-shrink-0">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          {{ lineup.likes_count }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { LineupWithRelations } from '~/types/database.types'
import type { ValorantAgent, ValorantMap } from '~/composables/useValorantApi'
import { getImageUrl } from '~/utils/getImageUrl'

const props = defineProps<{
  lineup: LineupWithRelations
  agent?: ValorantAgent
  map?: ValorantMap
}>()

const siteColors: Record<string, string> = {
  'A': 'text-rose-400',
  'B': 'text-green-300',
  'C': 'text-yellow-300',
  'Mid': 'text-purple-300',
}

const sideColors: Record<string, string> = {
  'attack': 'text-orange-300',
  'defense': 'text-cyan-300',
}

const siteColor = computed(() => {
  if (!props.lineup.site) return 'text-gray-200'
  return siteColors[props.lineup.site] ?? 'text-gray-200'
})

const sideColor = computed(() => {
  if (!props.lineup.side) return 'text-gray-200'
  return sideColors[props.lineup.side] ?? 'text-gray-200'
})
const firstMedia = computed(() => {
  const media = props.lineup.media
  if (!media?.length) return null
  const cover = media.find(m => m.is_cover)
  if (cover) return cover
  const sorted = [...media].sort((a, b) => a.sort_order - b.sort_order)
  return sorted[0] ?? null
})
</script>
