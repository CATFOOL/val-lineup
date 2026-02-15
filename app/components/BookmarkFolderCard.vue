<template>
  <NuxtLink
    :to="`/bookmarks/${folder.id}`"
    class="block bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-red-500 transition-all"
  >
    <div class="aspect-video bg-gray-700 relative">
      <!-- 2x2 grid of lineup thumbnails -->
      <div v-if="coverImages.length" class="w-full h-full grid grid-cols-2 grid-rows-2">
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
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <!-- Default badge -->
      <div
        v-if="folder.is_default"
        class="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded"
      >
        Default
      </div>
      <!-- Lineup count badge -->
      <div class="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
        {{ folder.lineups_count }} {{ folder.lineups_count === 1 ? 'lineup' : 'lineups' }}
      </div>
    </div>
    <div class="p-4">
      <h3 class="text-white font-semibold mb-2 line-clamp-1">{{ folder.title }}</h3>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { BookmarkFolderWithCount } from '~/types/database.types'

const props = defineProps<{
  folder: BookmarkFolderWithCount & {
    cover_bookmarks?: { lineup: { media: { url: string }[] } }[]
  }
}>()

const coverImages = computed(() => {
  const bookmarks = props.folder.cover_bookmarks
  if (!bookmarks?.length) return []
  return bookmarks
    .map(b => getLineupThumbnail(b.lineup?.media || []))
    .filter(Boolean)
    .slice(0, 4) as string[]
})
</script>
