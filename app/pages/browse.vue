<template>
  <div>
    <!-- Browse Mode Toggle -->
    <div class="flex gap-2 mb-8">
      <button
        @click="switchMode('lineups')"
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="browseMode === 'lineups' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'"
      >
        Lineups
      </button>
      <button
        @click="switchMode('collections')"
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="browseMode === 'collections' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'"
      >
        Collections
      </button>
    </div>

    <!-- Filter Panel (lineups only) -->
    <div v-if="browseMode === 'lineups'" class="bg-gray-800/50 rounded-xl p-6 mb-8">
      <div class="flex gap-8">
        <!-- Map Filter (Left Sidebar with scroll) -->
        <div class="w-36 flex-shrink-0 border-r border-gray-700 pr-6">
          <h3 class="text-sm font-medium text-gray-400 mb-3">Map</h3>
          <div class="map-scroll-container space-y-1 max-h-[350px]">
            <button
              @click="updateFilter('map', '')"
              class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
              :class="filters.map === '' ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-700'"
            >
              Any
            </button>
            <button
              v-for="map in maps"
              :key="map.uuid"
              @click="updateFilter('map', map.uuid)"
              class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
              :class="filters.map === map.uuid ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-700'"
            >
              {{ map.displayName }}
            </button>
          </div>
        </div>

        <!-- Right Side Filters -->
        <div class="flex-1 space-y-5">
          <!-- Search -->
          <div>
            <h3 class="text-sm font-medium text-gray-400 mb-3">Search</h3>
            <input
              :value="filters.search"
              @input="updateFilter('search', ($event.target as HTMLInputElement).value)"
              type="text"
              placeholder="Search by title or description..."
              class="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          <!-- Agent Filter -->
          <div>
            <h3 class="text-sm font-medium text-gray-400 mb-3">Agent</h3>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="agent in agents"
                :key="agent.uuid"
                @click="selectAgent(agent.uuid)"
                class="w-12 h-12 rounded-md overflow-hidden border-2 transition-all"
                :class="filters.agent === agent.uuid ? 'border-red-500' : 'border-transparent opacity-50 hover:opacity-100'"
                :title="agent.displayName"
              >
                <img :src="agent.displayIcon" :alt="agent.displayName" class="w-full h-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Ability Filter -->
          <div v-if="selectedAgentAbilities.length">
            <h3 class="text-sm font-medium text-gray-400 mb-3">Ability</h3>
            <div class="flex gap-2">
              <button
                v-for="ability in selectedAgentAbilities"
                :key="ability.slot"
                @click="toggleAbility(ability.slot)"
                class="w-12 h-12 rounded-md overflow-hidden border-2 transition-all bg-gray-700 flex items-center justify-center"
                :class="filters.abilities.includes(ability.slot) ? 'border-red-500' : 'border-transparent opacity-50 hover:opacity-100'"
                :title="`${abilitySlotToKey(ability.slot)} - ${ability.displayName}`"
              >
                <img v-if="ability.displayIcon" :src="ability.displayIcon" :alt="ability.displayName" class="w-8 h-8 object-contain" />
                <span v-else class="text-white text-xs">{{ abilitySlotToKey(ability.slot) }}</span>
              </button>
            </div>
          </div>

          <!-- Site & Side Filters Row -->
          <div class="flex gap-8">
            <!-- Site Filter -->
            <div>
              <h3 class="text-sm font-medium text-gray-400 mb-3">Site</h3>
              <div class="flex gap-1.5">
                <button
                  v-for="site in sites"
                  :key="site.value"
                  @click="updateFilter('site', filters.site === site.value ? '' : site.value)"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  :class="filters.site === site.value ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                >
                  {{ site.label }}
                </button>
              </div>
            </div>

            <!-- Side Filter -->
            <div>
              <h3 class="text-sm font-medium text-gray-400 mb-3">Side</h3>
              <div class="flex gap-1.5">
                <button
                  v-for="side in sides"
                  :key="side.value"
                  @click="updateFilter('side', filters.side === side.value ? '' : side.value)"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  :class="filters.side === side.value ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                >
                  {{ side.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lineups Results -->
    <div v-if="browseMode === 'lineups'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">
          Top Results
          <span v-if="lineups.length" class="text-gray-400 font-normal">({{ lineups.length }}{{ hasMore ? '+' : '' }} results)</span>
        </h2>
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="text-sm text-gray-400 hover:text-white"
        >
          Clear filters
        </button>
      </div>

      <div v-if="loading && !lineups.length" class="text-gray-400">Loading lineups...</div>
      <div v-else-if="lineups.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <LineupCard
          v-for="lineup in lineups"
          :key="lineup.id"
          :lineup="lineup"
          :agent="agentsMap[lineup.agent_uuid]"
          :map="mapsMap[lineup.map_uuid]"
        />
      </div>
      <div v-else class="text-gray-400">No lineups found. Try adjusting your filters.</div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="h-10 flex items-center justify-center mt-4">
        <span v-if="loading && lineups.length" class="text-gray-500 text-sm">Loading more...</span>
      </div>
    </div>

    <!-- Collections Results -->
    <div v-else>
      <!-- Search for collections -->
      <div class="bg-gray-800/50 rounded-xl p-6 mb-8">
        <h3 class="text-sm font-medium text-gray-400 mb-3">Search</h3>
        <input
          :value="collectionsSearch"
          @input="setCollectionsSearch(($event.target as HTMLInputElement).value)"
          type="text"
          placeholder="Search collections by title..."
          class="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:border-red-500 focus:outline-none"
        />
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">
          Collections
          <span v-if="browseCollections.length" class="text-gray-400 font-normal">({{ browseCollections.length }}{{ collectionsHasMore ? '+' : '' }})</span>
        </h2>
      </div>

      <div v-if="collectionsLoading && !browseCollections.length" class="text-gray-400">Loading collections...</div>
      <div v-else-if="browseCollections.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <CollectionCard
          v-for="col in browseCollections"
          :key="col.id"
          :collection="col"
        />
      </div>
      <div v-else class="text-gray-400">No collections found.</div>

      <!-- Infinite scroll sentinel -->
      <div ref="collectionsSentinel" class="h-10 flex items-center justify-center mt-4">
        <span v-if="collectionsLoading && browseCollections.length" class="text-gray-500 text-sm">Loading more...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LineupWithRelations, CollectionWithRelations } from '~/types/database.types'

const PAGE_SIZE = 20

const supabase = useSupabaseClient<any>()

// Use shared filter composable with persistence
const {
  filters,
  agents,
  maps,
  agentsMap,
  mapsMap,
  selectedAgentAbilities,
  sites,
  sides,
  updateFilter,
  selectAgent,
  toggleAbility,
  hasActiveFilters,
  clearFilters,
  applyFiltersToQuery,
  abilitySlotToKey
} = useLineupFilters({
  persistKey: 'browse-filters',
  onFiltersChange: () => {
    clearCachedLineups()
    fetchLineups(true)
  }
})

// Use browse page state composable (scroll, cache, mode)
const {
  browseMode,
  collectionsSearch,
  cachedLineups,
  cachedHasMore,
  setBrowseMode,
  setCollectionsSearch,
  saveScrollPosition,
  restoreScrollPosition,
  setCachedLineups,
  clearCachedLineups
} = useBrowseState()

// Track deleted lineups to remove from cache
const { deletedLineupIds, updatedLineupIds, hasNewLineup } = useLineupEvents()

// Collections state (not persisted - will refetch)
const browseCollections = ref<(CollectionWithRelations & { cover_lineups?: any[] })[]>([])
const collectionsLoading = ref(false)
const collectionsHasMore = ref(true)
const collectionsSentinel = ref<HTMLElement | null>(null)

function switchMode(mode: 'lineups' | 'collections') {
  setBrowseMode(mode)
  if (mode === 'collections' && !browseCollections.value.length) {
    fetchBrowseCollections(true)
  }
}

async function fetchBrowseCollections(reset = false) {
  if (collectionsLoading.value) return
  if (!reset && !collectionsHasMore.value) return

  collectionsLoading.value = true

  if (reset) {
    browseCollections.value = []
    collectionsHasMore.value = true
  }

  const from = browseCollections.value.length
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('collections')
    .select(`
      *,
      profile:profiles(*),
      lineups_count:collection_lineups(count),
      subscribers_count:collection_subscriptions(count),
      cover_lineups:collection_lineups(
        lineups:lineup_id!inner(
          media:lineup_media(url, sort_order, is_cover)
        )
      )
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (collectionsSearch.value) {
    const pattern = `%${collectionsSearch.value}%`
    query = query.ilike('title', pattern)
  }

  const { data } = await query

  const items = (data ?? []).map((item: any) => ({
    ...item,
    lineups_count: item.lineups_count?.[0]?.count ?? 0,
    subscribers_count: item.subscribers_count?.[0]?.count ?? 0,
    cover_lineups: (item.cover_lineups ?? [])
      .map((cl: any) => cl.lineups)
      .filter(Boolean)
      .slice(0, 4)
  })) as (CollectionWithRelations & { cover_lineups?: any[] })[]

  browseCollections.value.push(...items)
  collectionsHasMore.value = items.length === PAGE_SIZE
  collectionsLoading.value = false
}

// Debounced collections search
let collectionsSearchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => collectionsSearch.value, () => {
  if (collectionsSearchTimer) clearTimeout(collectionsSearchTimer)
  collectionsSearchTimer = setTimeout(() => fetchBrowseCollections(true), 300)
})

// Pagination state - use cached data if available
const lineups = ref<LineupWithRelations[]>(cachedLineups.value.length ? [...cachedLineups.value] : [])
const loading = ref(false)
const hasMore = ref(cachedLineups.value.length ? cachedHasMore.value : true)
const sentinel = ref<HTMLElement | null>(null)

async function fetchLineups(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true

  if (reset) {
    lineups.value = []
    hasMore.value = true
  }

  const from = lineups.value.length
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('lineups')
    .select(`
      *,
      profile:profiles(*),
      media:lineup_media(*),
      likes_count:lineup_likes(count),
      bookmarks_count:lineup_bookmarks(count)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .range(from, to)

  // Apply filters using the composable helper
  query = applyFiltersToQuery(query)

  const { data } = await query

  const items = (data ?? []).map((item: any) => ({
    ...item,
    likes_count: item.likes_count?.[0]?.count ?? 0,
    bookmarks_count: item.bookmarks_count?.[0]?.count ?? 0
  })) as LineupWithRelations[]

  lineups.value.push(...items)
  hasMore.value = items.length === PAGE_SIZE
  loading.value = false
}

// Initial fetch only if no cached data
if (!cachedLineups.value.length) {
  await fetchLineups()
}

// Debounced search (separate from other filters)
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => filters.value.search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    clearCachedLineups()
    fetchLineups(true)
  }, 300)
})

// Infinite scroll with IntersectionObserver
let observer: IntersectionObserver | null = null
let collectionsObserver: IntersectionObserver | null = null

onMounted(() => {
  // Restore scroll position when returning to this page
  restoreScrollPosition()

  // Filter out any deleted lineups from cache
  if (deletedLineupIds.value.size > 0 && lineups.value.length > 0) {
    lineups.value = lineups.value.filter(l => !deletedLineupIds.value.has(l.id))
  }

  // If any lineup was updated or created, clear cache and refetch to get fresh data
  if (updatedLineupIds.value.size > 0 || hasNewLineup.value) {
    clearCachedLineups()
    lineups.value = []
    hasMore.value = true
    fetchLineups()
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value && !loading.value) {
        fetchLineups()
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)

  collectionsObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && collectionsHasMore.value && !collectionsLoading.value) {
        fetchBrowseCollections()
      }
    },
    { rootMargin: '200px' }
  )
  if (collectionsSentinel.value) collectionsObserver.observe(collectionsSentinel.value)
})

// Save scroll position and cache data before leaving
onBeforeUnmount(() => {
  saveScrollPosition()
  setCachedLineups(lineups.value, hasMore.value)
})

onUnmounted(() => {
  observer?.disconnect()
  collectionsObserver?.disconnect()
})
</script>

<style scoped>
.map-scroll-container {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 #1f2937;
  scrollbar-gutter: stable;
  padding-right: 4px;
  overflow-y: scroll !important;
}

.map-scroll-container::-webkit-scrollbar {
  width: 6px;
  -webkit-appearance: none;
  display: block !important;
}

.map-scroll-container::-webkit-scrollbar-track:vertical {
  display: block;
}

.map-scroll-container::-webkit-scrollbar-track {
  background: #1f2937;
  border-radius: 3px;
}

.map-scroll-container::-webkit-scrollbar-thumb {
  background-color: #4b5563;
  border-radius: 3px;
}

.map-scroll-container::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}
</style>
