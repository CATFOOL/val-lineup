<template>
  <div>
    <!-- Author Header -->
    <div v-if="profile" class="bg-gray-800/50 rounded-xl p-6 mb-8">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
          <img
            v-if="profile.avatar_url"
            :src="profile.avatar_url"
            :alt="profile.username"
            class="w-full h-full object-cover"
          />
          <span v-else class="text-2xl text-gray-400">{{ profile.username?.charAt(0)?.toUpperCase() }}</span>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-white">{{ profile.username }}</h1>
          <p class="text-gray-400 text-sm">
            Joined {{ formatDate(profile.created_at) }}
          </p>
        </div>
      </div>
      <div class="mt-4 flex gap-6 text-sm">
        <div>
          <span class="text-white font-semibold">{{ lineupsCount ?? 0 }}</span>
          <span class="text-gray-400 ml-1">{{ lineupsCount === 1 ? 'Lineup' : 'Lineups' }}</span>
        </div>
        <div>
          <span class="text-white font-semibold">{{ collectionsCount ?? 0 }}</span>
          <span class="text-gray-400 ml-1">{{ collectionsCount === 1 ? 'Collection' : 'Collections' }}</span>
        </div>
      </div>
    </div>
    <div v-else-if="profilePending" class="bg-gray-800/50 rounded-xl p-6 mb-8">
      <div class="text-gray-400">Loading author...</div>
    </div>
    <div v-else class="bg-gray-800/50 rounded-xl p-6 mb-8">
      <div class="text-red-400">Author not found</div>
    </div>

    <!-- Tabs -->
    <div v-if="profile" class="flex gap-2 mb-8">
      <button
        @click="switchTab('lineups')"
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="activeTab === 'lineups' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'"
      >
        {{ isOwnProfile ? 'My Lineups' : 'Lineups' }}
      </button>
      <button
        @click="switchTab('collections')"
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="activeTab === 'collections' || activeTab === 'subscribed' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'"
      >
        Collections
      </button>
      <template v-if="isOwnProfile">
        <button
          @click="switchTab('liked')"
          class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="activeTab === 'liked' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'"
        >
          Liked
        </button>
        <button
          @click="switchTab('bookmarked')"
          class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="activeTab === 'bookmarked' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'"
        >
          Bookmarked
        </button>
      </template>
    </div>

    <!-- Filter Panel -->
    <div v-if="profile && activeTab !== 'collections' && activeTab !== 'subscribed' && activeTab !== 'bookmarked'" class="bg-gray-800/50 rounded-xl p-6 mb-8">
      <div class="flex gap-8">
        <!-- Map Filter -->
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
            <div>
              <h3 class="text-sm font-medium text-gray-400 mb-3">Site</h3>
              <div class="flex gap-1.5">
                <button
                  v-for="site in sites"
                  :key="site.value"
                  @click="toggleSite(site.value)"
                  class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                  :class="filters.site === site.value ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
                >
                  {{ site.label }}
                </button>
              </div>
            </div>
            <div>
              <h3 class="text-sm font-medium text-gray-400 mb-3">Side</h3>
              <div class="flex gap-1.5">
                <button
                  v-for="side in sides"
                  :key="side.value"
                  @click="toggleSide(side.value)"
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

    <!-- Results -->
    <div v-if="profile && (activeTab === 'collections' || activeTab === 'subscribed')">
      <!-- Sub-tabs for Collections -->
      <div v-if="isOwnProfile" class="flex gap-2 mb-6">
        <button
          @click="switchTab('collections')"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="activeTab === 'collections' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          My Collections
        </button>
        <button
          @click="switchTab('subscribed')"
          class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
          :class="activeTab === 'subscribed' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'"
        >
          Subscribed
        </button>
      </div>

      <!-- My Collections content -->
      <div v-if="activeTab === 'collections'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">
            {{ isOwnProfile ? 'My Collections' : 'Collections' }}
            <span v-if="collections.length" class="text-gray-400 font-normal">({{ collections.length }}{{ collectionsHasMore ? '+' : '' }})</span>
          </h2>
          <button
            v-if="isOwnProfile"
            @click="showCreateCollection = true"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
          >
            + New Collection
          </button>
        </div>

        <div v-if="collectionsLoading && !collections.length" class="text-gray-400">Loading collections...</div>
        <div v-else-if="collections.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <CollectionCard
            v-for="col in collections"
            :key="col.id"
            :collection="col"
          />
        </div>
        <div v-else class="text-gray-400">No collections yet.</div>

        <!-- Infinite scroll sentinel -->
        <div ref="collectionsSentinel" class="h-10 flex items-center justify-center mt-4">
          <span v-if="collectionsLoading && collections.length" class="text-gray-500 text-sm">Loading more...</span>
        </div>
      </div>

      <!-- Subscribed Collections content -->
      <div v-else-if="activeTab === 'subscribed'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-white">
            Subscribed Collections
            <span v-if="subscribedCollections.length" class="text-gray-400 font-normal">({{ subscribedCollections.length }}{{ subscribedCollectionsHasMore ? '+' : '' }})</span>
          </h2>
        </div>

        <div v-if="subscribedCollectionsLoading && !subscribedCollections.length" class="text-gray-400">Loading collections...</div>
        <div v-else-if="subscribedCollections.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <CollectionCard
            v-for="col in subscribedCollections"
            :key="col.id"
            :collection="col"
          />
        </div>
        <div v-else class="text-gray-400">No subscribed collections yet.</div>

        <!-- Infinite scroll sentinel -->
        <div ref="subscribedCollectionsSentinel" class="h-10 flex items-center justify-center mt-4">
          <span v-if="subscribedCollectionsLoading && subscribedCollections.length" class="text-gray-500 text-sm">Loading more...</span>
        </div>
      </div>
    </div>

    <!-- Bookmarked Tab - Bookmark Folders -->
    <div v-else-if="profile && activeTab === 'bookmarked'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">
          My Bookmarks
          <span v-if="bookmarkFolders.length" class="text-gray-400 font-normal">({{ bookmarkFolders.length }}{{ bookmarkFoldersHasMore ? '+' : '' }})</span>
        </h2>
        <button
          @click="showCreateBookmarkFolder = true"
          class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm transition-colors"
        >
          + New Folder
        </button>
      </div>

      <div v-if="bookmarkFoldersLoading && !bookmarkFolders.length" class="text-gray-400">Loading...</div>
      <div v-else-if="bookmarkFolders.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <BookmarkFolderCard
          v-for="folder in bookmarkFolders"
          :key="folder.id"
          :folder="folder"
        />
      </div>
      <div v-else class="text-gray-400">No bookmark folders yet.</div>

      <!-- Infinite scroll sentinel -->
      <div ref="bookmarkFoldersSentinel" class="h-10 flex items-center justify-center mt-4">
        <span v-if="bookmarkFoldersLoading && bookmarkFolders.length" class="text-gray-500 text-sm">Loading more...</span>
      </div>
    </div>

    <div v-else-if="profile">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">
          {{ activeTab === 'liked' ? 'Liked Lineups' : activeTab === 'bookmarked' ? 'Bookmarked Lineups' : isOwnProfile ? 'My Lineups' : 'Lineups' }}
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
      <div v-else-if="lineupsError" class="text-red-400">
        Failed to load: {{ lineupsError }}
        <button type="button" class="ml-2 underline" @click="fetchLineups(true)">Retry</button>
      </div>
      <div v-else-if="lineups.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <LineupCard
          v-for="lineup in lineups"
          :key="lineup.id"
          :lineup="lineup"
          :agent="agentsMap[lineup.agent_uuid]"
          :map="mapsMap[lineup.map_uuid]"
        />
      </div>
      <div v-else class="text-gray-400">
        {{ activeTab === 'liked' ? 'No liked lineups yet.' : activeTab === 'bookmarked' ? 'No bookmarked lineups yet.' : 'No lineups found. Try adjusting your filters.' }}
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="h-10 flex items-center justify-center mt-4">
        <span v-if="loading && lineups.length" class="text-gray-500 text-sm">Loading more...</span>
      </div>
    </div>
  </div>

  <!-- Create Collection Modal -->
  <Teleport to="body">
    <div
      v-if="showCreateCollection"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60" @click="showCreateCollection = false" />
      <div class="relative bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 class="text-lg font-semibold text-white mb-4">Create New Collection</h3>
        <input
          v-model="newCollectionTitle"
          type="text"
          placeholder="Collection name..."
          class="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:border-red-500 focus:outline-none mb-6"
          @keyup.enter="createCollection"
        />
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="showCreateCollection = false"
            class="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="createCollection"
            :disabled="!newCollectionTitle.trim() || creatingCollection"
            class="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {{ creatingCollection ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Create Bookmark Folder Modal -->
  <Teleport to="body">
    <div
      v-if="showCreateBookmarkFolder"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60" @click="showCreateBookmarkFolder = false" />
      <div class="relative bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 class="text-lg font-semibold text-white mb-4">Create New Folder</h3>
        <input
          v-model="newBookmarkFolderTitle"
          type="text"
          placeholder="Folder name..."
          class="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:border-red-500 focus:outline-none mb-6"
          @keyup.enter="createBookmarkFolder"
        />
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="showCreateBookmarkFolder = false"
            class="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="createBookmarkFolder"
            :disabled="!newBookmarkFolderTitle.trim() || creatingBookmarkFolder"
            class="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {{ creatingBookmarkFolder ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { LineupWithRelations, CollectionWithRelations, BookmarkFolderWithCount } from '~/types/database.types'

const PAGE_SIZE = 20

interface ProfileData {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

const route = useRoute()
const supabase = useSupabaseClient<any>()
const user = useSupabaseUser()

const username = route.params.username as string
const currentUserId = computed(() => (user.value as any)?.id ?? (user.value as any)?.sub)

// Use profile page state composable (scroll, cache, tab)
const {
  activeTab,
  cachedLineups,
  cachedHasMore,
  setActiveTab,
  saveScrollPosition,
  restoreScrollPosition,
  setCachedLineups,
  clearCachedLineups
} = useProfileState(username)

// Track deleted lineups to remove from cache
const { deletedLineupIds, updatedLineupIds, hasNewLineup } = useLineupEvents()

// Use shared filter composable with persistence per profile
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
  toggleSite,
  toggleSide,
  hasActiveFilters,
  clearFilters,
  applyFiltersToQuery,
  abilitySlotToKey
} = useLineupFilters({
  persistKey: `profile-filters-${username}`,
  onFiltersChange: () => {
    clearCachedLineups()
    fetchLineups(true)
  }
})

// Fetch profile by username
const profile = ref<ProfileData | null>(null)
const profilePending = ref(true)

const { data: profileData } = await useAsyncData(`profile-${username}`, async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  return data as ProfileData | null
})

profile.value = profileData.value ?? null
profilePending.value = false

// Fetch total lineup count for header (independent of tab/pagination)
const { data: lineupsCount } = await useAsyncData(`profile-lineups-count-${username}`, async () => {
  if (!profile.value) return 0
  const { count } = await supabase
    .from('lineups')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.value.id)
    .eq('is_published', true)
  return count || 0
})

// Fetch total collections count for header
const { data: collectionsCount } = await useAsyncData(`profile-collections-count-${username}`, async () => {
  if (!profile.value) return 0
  const { count } = await supabase
    .from('collections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.value.id)
    .eq('is_published', true)
  return count || 0
})

// Check if viewing own profile
const isOwnProfile = computed(() => !!profile.value && !!currentUserId.value && profile.value.id === currentUserId.value)

// Tab switching
function switchTab(tab: 'lineups' | 'liked' | 'bookmarked' | 'collections' | 'subscribed') {
  if (activeTab.value === tab) return
  setActiveTab(tab)
  if (tab === 'collections') {
    fetchCollections(true)
  } else if (tab === 'subscribed') {
    fetchSubscribedCollections(true)
  } else if (tab === 'bookmarked') {
    fetchBookmarkFolders(true)
  } else {
    clearCachedLineups()
    fetchLineups(true)
  }
}

// Pagination state - use cached data if available
const lineups = ref<LineupWithRelations[]>(cachedLineups.value.length ? [...cachedLineups.value] : [])
const loading = ref(false)
const hasMore = ref(cachedLineups.value.length ? cachedHasMore.value : true)
const lineupsError = ref<string | null>(null)
const sentinel = ref<HTMLElement | null>(null)

async function fetchLineups(reset = false) {
  if (!profile.value) return
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true
  lineupsError.value = null

  if (reset) {
    lineups.value = []
    hasMore.value = true
  }

  const from = lineups.value.length
  const to = from + PAGE_SIZE - 1

  let data: any[] | null = null
  let error: any = null

  if (activeTab.value === 'liked') {
    let query = supabase
      .from('lineup_likes')
      .select(`
        lineup_id,
        lineups:lineup_id!inner(
          *,
          profile:profiles(*),
          media:lineup_media(*),
          likes_count:lineup_likes(count),
          bookmarks_count:lineup_bookmarks(count)
        )
      `)
      .eq('user_id', profile.value.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters.value.map) query = query.eq('lineups.map_uuid', filters.value.map)
    if (filters.value.agent) query = query.eq('lineups.agent_uuid', filters.value.agent)
    if (filters.value.abilities.length) query = query.in('lineups.ability', filters.value.abilities)
    if (filters.value.site) query = query.eq('lineups.site', filters.value.site)
    if (filters.value.side) query = query.eq('lineups.side', filters.value.side)
    if (filters.value.search) {
      const pattern = `%${filters.value.search}%`
      query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`, { foreignTable: 'lineups' })
    }

    const res = await query
    data = res.data
    error = res.error
  } else if (activeTab.value === 'bookmarked') {
    let query = supabase
      .from('lineup_bookmarks')
      .select(`
        lineup_id,
        lineups:lineup_id!inner(
          *,
          profile:profiles(*),
          media:lineup_media(*),
          likes_count:lineup_likes(count),
          bookmarks_count:lineup_bookmarks(count)
        )
      `)
      .eq('user_id', profile.value.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (filters.value.map) query = query.eq('lineups.map_uuid', filters.value.map)
    if (filters.value.agent) query = query.eq('lineups.agent_uuid', filters.value.agent)
    if (filters.value.abilities.length) query = query.in('lineups.ability', filters.value.abilities)
    if (filters.value.site) query = query.eq('lineups.site', filters.value.site)
    if (filters.value.side) query = query.eq('lineups.side', filters.value.side)
    if (filters.value.search) {
      const pattern = `%${filters.value.search}%`
      query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`, { foreignTable: 'lineups' })
    }

    const res = await query
    data = res.data
    error = res.error
  } else {
    let query = supabase
      .from('lineups')
      .select(`
        *,
        profile:profiles(*),
        media:lineup_media(*),
        likes_count:lineup_likes(count),
        bookmarks_count:lineup_bookmarks(count)
      `)
      .eq('user_id', profile.value.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!isOwnProfile.value) {
      query = query.eq('is_published', true)
    }
    if (filters.value.map) query = query.eq('map_uuid', filters.value.map)
    if (filters.value.agent) query = query.eq('agent_uuid', filters.value.agent)
    if (filters.value.abilities.length) query = query.in('ability', filters.value.abilities)
    if (filters.value.site) query = query.eq('site', filters.value.site)
    if (filters.value.side) query = query.eq('side', filters.value.side)
    if (filters.value.search) {
      const pattern = `%${filters.value.search}%`
      query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
    }

    const res = await query
    data = res.data
    error = res.error
  }

  if (error) {
    lineupsError.value = error.message
    loading.value = false
    return
  }

  let items: LineupWithRelations[]

  if (activeTab.value === 'liked' || activeTab.value === 'bookmarked') {
    items = (data ?? [])
      .map((row: any) => row.lineups)
      .filter(Boolean)
      .map((item: any) => ({
        ...item,
        likes_count: item.likes_count?.[0]?.count ?? 0,
        bookmarks_count: item.bookmarks_count?.[0]?.count ?? 0
      }))
  } else {
    items = (data ?? []).map((item: any) => ({
      ...item,
      likes_count: item.likes_count?.[0]?.count ?? 0,
      bookmarks_count: item.bookmarks_count?.[0]?.count ?? 0
    }))
  }

  lineups.value.push(...items)
  hasMore.value = items.length === PAGE_SIZE
  loading.value = false
}

// Initial fetch only if no cached data
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
    return
  }

  if (!cachedLineups.value.length) {
    fetchLineups()
  }
})

// Collections state
const collections = ref<CollectionWithRelations[]>([])
const collectionsLoading = ref(false)
const collectionsHasMore = ref(true)
const collectionsSentinel = ref<HTMLElement | null>(null)
const showCreateCollection = ref(false)
const newCollectionTitle = ref('')
const creatingCollection = ref(false)

async function createCollection() {
  if (!newCollectionTitle.value.trim() || !currentUserId.value) return
  creatingCollection.value = true

  const { data: newCol } = await supabase
    .from('collections')
    .insert({
      user_id: currentUserId.value,
      title: newCollectionTitle.value.trim(),
      is_published: true
    })
    .select('*, profile:profiles(*)')
    .single()

  if (newCol) {
    collections.value.unshift({
      ...newCol,
      lineups_count: 0,
      subscribers_count: 0,
      cover_lineups: []
    } as any)
  }

  newCollectionTitle.value = ''
  showCreateCollection.value = false
  creatingCollection.value = false
}

async function fetchCollections(reset = false) {
  if (!profile.value) return
  if (collectionsLoading.value) return
  if (!reset && !collectionsHasMore.value) return

  collectionsLoading.value = true

  if (reset) {
    collections.value = []
    collectionsHasMore.value = true
  }

  const from = collections.value.length
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('collections')
    .select(`
      *,
      profile:profiles(*),
      lineups_count:collection_lineups(count),
      subscribers_count:collection_subscriptions(count),
      collection_lineups(
        lineup:lineups(
          media:lineup_media(*)
        )
      )
    `)
    .eq('user_id', profile.value.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (!isOwnProfile.value) {
    query = query.eq('is_published', true)
  }

  const { data, error } = await query

  if (error) {
    collectionsLoading.value = false
    return
  }

  const items = (data ?? []).map((item: any) => ({
    ...item,
    lineups_count: item.lineups_count?.[0]?.count ?? 0,
    subscribers_count: item.subscribers_count?.[0]?.count ?? 0,
    cover_lineups: (item.collection_lineups ?? [])
      .map((cl: any) => cl.lineup)
      .filter(Boolean)
      .slice(0, 4)
  })) as CollectionWithRelations[]

  collections.value.push(...items)
  collectionsHasMore.value = items.length === PAGE_SIZE
  collectionsLoading.value = false
}

// Subscribed Collections state
const subscribedCollections = ref<CollectionWithRelations[]>([])
const subscribedCollectionsLoading = ref(false)
const subscribedCollectionsHasMore = ref(true)
const subscribedCollectionsSentinel = ref<HTMLElement | null>(null)

async function fetchSubscribedCollections(reset = false) {
  if (!profile.value || !isOwnProfile.value) return
  if (subscribedCollectionsLoading.value) return
  if (!reset && !subscribedCollectionsHasMore.value) return

  subscribedCollectionsLoading.value = true

  if (reset) {
    subscribedCollections.value = []
    subscribedCollectionsHasMore.value = true
  }

  const from = subscribedCollections.value.length
  const to = from + PAGE_SIZE - 1

  const { data, error } = await supabase
    .from('collection_subscriptions')
    .select(`
      collection_id,
      collections:collection_id!inner(
        *,
        profile:profiles(*),
        lineups_count:collection_lineups(count),
        subscribers_count:collection_subscriptions(count),
        collection_lineups(
          lineup:lineups(
            media:lineup_media(*)
          )
        )
      )
    `)
    .eq('user_id', profile.value.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    subscribedCollectionsLoading.value = false
    return
  }

  const items = (data ?? [])
    .map((row: any) => row.collections)
    .filter(Boolean)
    .map((item: any) => ({
      ...item,
      lineups_count: item.lineups_count?.[0]?.count ?? 0,
      subscribers_count: item.subscribers_count?.[0]?.count ?? 0,
      cover_lineups: (item.collection_lineups ?? [])
        .map((cl: any) => cl.lineup)
        .filter(Boolean)
        .slice(0, 4)
    })) as CollectionWithRelations[]

  subscribedCollections.value.push(...items)
  subscribedCollectionsHasMore.value = items.length === PAGE_SIZE
  subscribedCollectionsLoading.value = false
}

// Bookmark Folders state
type BookmarkFolderWithCover = BookmarkFolderWithCount & {
  cover_bookmarks?: { lineup: { media: { url: string }[] } }[]
}
const bookmarkFolders = ref<BookmarkFolderWithCover[]>([])
const bookmarkFoldersLoading = ref(false)
const bookmarkFoldersHasMore = ref(true)
const bookmarkFoldersSentinel = ref<HTMLElement | null>(null)
const showCreateBookmarkFolder = ref(false)
const newBookmarkFolderTitle = ref('')
const creatingBookmarkFolder = ref(false)

async function createBookmarkFolder() {
  if (!newBookmarkFolderTitle.value.trim() || !currentUserId.value) return
  creatingBookmarkFolder.value = true

  const { data: newFolder } = await supabase
    .from('bookmark_folders')
    .insert({
      user_id: currentUserId.value,
      title: newBookmarkFolderTitle.value.trim(),
      is_default: false
    })
    .select('*')
    .single()

  if (newFolder) {
    bookmarkFolders.value.unshift({
      ...newFolder,
      lineups_count: 0,
      cover_bookmarks: []
    })
  }

  newBookmarkFolderTitle.value = ''
  showCreateBookmarkFolder.value = false
  creatingBookmarkFolder.value = false
}

async function fetchBookmarkFolders(reset = false) {
  if (!profile.value || !isOwnProfile.value) return
  if (bookmarkFoldersLoading.value) return
  if (!reset && !bookmarkFoldersHasMore.value) return

  bookmarkFoldersLoading.value = true

  if (reset) {
    bookmarkFolders.value = []
    bookmarkFoldersHasMore.value = true
  }

  const from = bookmarkFolders.value.length
  const to = from + PAGE_SIZE - 1

  const { data, error } = await supabase
    .from('bookmark_folders')
    .select(`
      *,
      lineups_count:lineup_bookmarks(count),
      cover_bookmarks:lineup_bookmarks(
        lineup:lineups(
          media:lineup_media(*)
        )
      )
    `)
    .eq('user_id', profile.value.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    bookmarkFoldersLoading.value = false
    return
  }

  const items = (data ?? []).map((item: any) => ({
    ...item,
    lineups_count: item.lineups_count?.[0]?.count ?? 0,
    cover_bookmarks: (item.cover_bookmarks ?? []).slice(0, 4)
  })) as BookmarkFolderWithCover[]

  bookmarkFolders.value.push(...items)
  bookmarkFoldersHasMore.value = items.length === PAGE_SIZE
  bookmarkFoldersLoading.value = false
}

// Debounced search (separate from other filters handled by composable)
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => filters.value.search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchLineups(true), 300)
})

// Infinite scroll with IntersectionObserver
let observer: IntersectionObserver | null = null
let collectionsObserver: IntersectionObserver | null = null
let subscribedCollectionsObserver: IntersectionObserver | null = null
let bookmarkFoldersObserver: IntersectionObserver | null = null

onMounted(() => {
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
        fetchCollections()
      }
    },
    { rootMargin: '200px' }
  )
  if (collectionsSentinel.value) collectionsObserver.observe(collectionsSentinel.value)

  subscribedCollectionsObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && subscribedCollectionsHasMore.value && !subscribedCollectionsLoading.value) {
        fetchSubscribedCollections()
      }
    },
    { rootMargin: '200px' }
  )
  if (subscribedCollectionsSentinel.value) subscribedCollectionsObserver.observe(subscribedCollectionsSentinel.value)

  bookmarkFoldersObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && bookmarkFoldersHasMore.value && !bookmarkFoldersLoading.value) {
        fetchBookmarkFolders()
      }
    },
    { rootMargin: '200px' }
  )
  if (bookmarkFoldersSentinel.value) bookmarkFoldersObserver.observe(bookmarkFoldersSentinel.value)
})

// Save scroll position and cache data before leaving
onBeforeUnmount(() => {
  saveScrollPosition()
  setCachedLineups(lineups.value, hasMore.value)
})

onUnmounted(() => {
  observer?.disconnect()
  collectionsObserver?.disconnect()
  subscribedCollectionsObserver?.disconnect()
  bookmarkFoldersObserver?.disconnect()
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
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
