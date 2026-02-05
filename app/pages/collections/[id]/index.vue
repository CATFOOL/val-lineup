<template>
  <div v-if="collection">
    <div class="flex items-center justify-between mb-6">
      <button @click="$router.back()" class="text-gray-400 hover:text-white">
        ← Back
      </button>
      <div v-if="isOwner" class="flex items-center gap-2">
        <button
          type="button"
          @click="showAddLineups = true"
          class="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          + Add Lineups
        </button>
        <NuxtLink
          :to="`/collections/${collection.id}/edit`"
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

    <!-- Collection Header -->
    <div class="bg-gray-800/50 rounded-xl p-6 mb-8">
      <h1 class="text-2xl font-bold text-white mb-2">{{ collection.title }}</h1>
      <p v-if="collection.description" class="text-gray-300 mb-4">{{ collection.description }}</p>
      <div class="flex items-center gap-4 text-sm text-gray-400">
        <NuxtLink
          v-if="collection.profile?.username"
          :to="`/profile/${collection.profile.username}`"
          class="flex items-center gap-1.5 hover:text-red-400 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          {{ collection.profile.username }}
        </NuxtLink>
        <span>{{ lineupsCount }} {{ lineupsCount === 1 ? 'lineup' : 'lineups' }}</span>
        <span>{{ formatDate(collection.created_at) }}</span>
      </div>
      <!-- Subscribe button -->
      <div class="flex items-center gap-4 mt-4">
        <button
          v-if="!isOwner"
          @click="toggleSubscribe"
          :disabled="subscribeLoading"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          :class="isSubscribed ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" :fill="isSubscribed ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>{{ isSubscribed ? 'Subscribed' : 'Subscribe' }}</span>
        </button>
        <span class="text-gray-400 text-sm">{{ subscribersCount }} {{ subscribersCount === 1 ? 'subscriber' : 'subscribers' }}</span>
      </div>
    </div>

    <!-- Lineups Grid -->
    <div v-if="loading && !lineups.length" class="text-gray-400">Loading lineups...</div>

    <!-- Owner: draggable grid -->
    <draggable
      v-else-if="isOwner && lineups.length"
      v-model="lineups"
      item-key="id"
      handle=".drag-handle"
      tag="div"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      :animation="200"
      ghost-class="opacity-30"
      @end="saveOrder"
    >
      <template #default>
        <div v-for="lineup in lineups" :key="lineup.id" class="relative group">
          <div
            class="drag-handle absolute top-2 right-2 z-10 cursor-grab active:cursor-grabbing bg-black/60 hover:bg-black/80 text-white/70 hover:text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Drag to reorder"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z"/></svg>
          </div>
          <LineupCard
            :lineup="lineup"
            :agent="agentsMap[lineup.agent_uuid]"
            :map="mapsMap[lineup.map_uuid]"
          />
        </div>
      </template>
    </draggable>

    <!-- Non-owner: regular grid -->
    <div v-else-if="lineups.length" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <LineupCard
        v-for="lineup in lineups"
        :key="lineup.id"
        :lineup="lineup"
        :agent="agentsMap[lineup.agent_uuid]"
        :map="mapsMap[lineup.map_uuid]"
      />
    </div>
    <div v-else class="text-gray-400">No lineups in this collection yet.</div>

    <!-- Infinite scroll sentinel (non-owner only) -->
    <div v-if="!isOwner" ref="sentinel" class="h-10 flex items-center justify-center mt-4">
      <span v-if="loading && lineups.length" class="text-gray-500 text-sm">Loading more...</span>
    </div>
  </div>
  <div v-else-if="pending" class="text-gray-400">Loading collection...</div>
  <div v-else class="text-gray-400">Collection not found.</div>

  <!-- Add Lineups Modal -->
  <AddToCollectionModal
    :collection-id="collectionId"
    :show="showAddLineups"
    @close="showAddLineups = false"
    @updated="onLineupsUpdated"
  />

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60" @click="showDeleteModal = false" />
      <div class="relative bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 class="text-lg font-semibold text-white mb-2">Delete Collection</h3>
        <p class="text-gray-400 mb-6">Are you sure you want to delete this collection? The lineups inside will not be deleted.</p>
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
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import type { LineupWithRelations } from '~/types/database.types'

const PAGE_SIZE = 20

const route = useRoute()
const supabase = useSupabaseClient<any>()
const user = useSupabaseUser()
const { getAgents, getMaps } = useValorantApi()

const collectionId = route.params.id as string
const currentUserId = computed(() => (user.value as any)?.id ?? (user.value as any)?.sub)

const showDeleteModal = ref(false)
const deleteLoading = ref(false)
const deleteError = ref<string | null>(null)
const showAddLineups = ref(false)
const subscribeLoading = ref(false)

function onLineupsUpdated() {
  fetchLineups(true)
  fetchCount()
}

// Fetch collection
const { data: collection, pending } = await useAsyncData(`collection-${collectionId}`, async () => {
  const { data } = await supabase
    .from('collections')
    .select('*, profile:profiles(*)')
    .eq('id', collectionId)
    .single()
  return data
})

const isOwner = computed(() => !!collection.value && !!currentUserId.value && collection.value.user_id === currentUserId.value)

// Fetch subscription data
const { data: subscriptionData, refresh: refreshSubscription } = await useAsyncData(
  `collection-subscription-${collectionId}`,
  async () => {
    if (!collection.value) return { count: 0, isSubscribed: false }

    const { count } = await supabase
      .from('collection_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collection.value.id)

    let isSubscribed = false
    if (currentUserId.value) {
      const { data } = await supabase
        .from('collection_subscriptions')
        .select('id')
        .eq('collection_id', collection.value.id)
        .eq('user_id', currentUserId.value)
        .maybeSingle()
      isSubscribed = !!data
    }

    return { count: count || 0, isSubscribed }
  },
  { watch: [currentUserId] }
)

const subscribersCount = computed(() => subscriptionData.value?.count ?? 0)
const isSubscribed = computed(() => subscriptionData.value?.isSubscribed ?? false)

const toggleSubscribe = async () => {
  if (!currentUserId.value || !collection.value) return
  subscribeLoading.value = true

  if (isSubscribed.value) {
    await supabase
      .from('collection_subscriptions')
      .delete()
      .eq('collection_id', collection.value.id)
      .eq('user_id', currentUserId.value)
  } else {
    await supabase
      .from('collection_subscriptions')
      .insert({
        collection_id: collection.value.id,
        user_id: currentUserId.value
      })
  }

  await refreshSubscription()
  subscribeLoading.value = false
}

// Fetch agents and maps
const { data: agents } = await useAsyncData('valorant-agents', () => getAgents())
const { data: maps } = await useAsyncData('valorant-maps', () => getMaps())

const agentsMap = computed(() => {
  if (!agents.value) return {}
  return agents.value.reduce((acc, agent) => {
    acc[agent.uuid] = agent
    return acc
  }, {} as Record<string, typeof agents.value[0]>)
})

const mapsMap = computed(() => {
  if (!maps.value) return {}
  return maps.value.reduce((acc, map) => {
    acc[map.uuid] = map
    return acc
  }, {} as Record<string, typeof maps.value[0]>)
})

// Fetch lineups in collection with pagination
const lineups = ref<LineupWithRelations[]>([])
const loading = ref(false)
const hasMore = ref(true)
const lineupsCount = ref(0)
const sentinel = ref<HTMLElement | null>(null)

async function fetchLineups(reset = false) {
  if (!collection.value) return
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true

  if (reset) {
    lineups.value = []
    hasMore.value = true
  }

  let query = supabase
    .from('collection_lineups')
    .select(`
      lineup_id,
      sort_order,
      lineups:lineup_id!inner(
        *,
        profile:profiles(*),
        media:lineup_media(*),
        likes_count:lineup_likes(count),
        bookmarks_count:lineup_bookmarks(count)
      )
    `)
    .eq('collection_id', collection.value.id)
    .order('sort_order', { ascending: true })
    .order('added_at', { ascending: false })

  // Owner loads all lineups at once for reordering; non-owner uses pagination
  if (!isOwner.value) {
    const from = lineups.value.length
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)
  }

  const { data, error } = await query

  if (error) {
    loading.value = false
    return
  }

  const items = (data ?? [])
    .map((row: any) => row.lineups)
    .filter(Boolean)
    .map((item: any) => ({
      ...item,
      likes_count: item.likes_count?.[0]?.count ?? 0,
      bookmarks_count: item.bookmarks_count?.[0]?.count ?? 0
    })) as LineupWithRelations[]

  if (isOwner.value) {
    lineups.value = items
    hasMore.value = false
  } else {
    lineups.value.push(...items)
    hasMore.value = items.length === PAGE_SIZE
  }
  loading.value = false
}

// Save sort order after drag-and-drop reorder
async function saveOrder() {
  if (!collection.value) return
  for (let i = 0; i < lineups.value.length; i++) {
    const lineup = lineups.value[i]
    if (!lineup) continue
    await supabase
      .from('collection_lineups')
      .update({ sort_order: i })
      .eq('collection_id', collection.value.id)
      .eq('lineup_id', lineup.id)
  }
}

// Fetch total count
async function fetchCount() {
  if (!collection.value) return
  const { count } = await supabase
    .from('collection_lineups')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collection.value.id)
  lineupsCount.value = count || 0
}

// Delete
function confirmDelete() {
  if (!collection.value || !isOwner.value) return
  deleteError.value = null
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!collection.value || !isOwner.value) return
  deleteLoading.value = true
  deleteError.value = null

  const { error } = await supabase.from('collections').delete().eq('id', collection.value.id)

  if (error) {
    deleteError.value = error.message
    deleteLoading.value = false
    return
  }

  await navigateTo('/profile')
}

// Initial fetch
onMounted(() => {
  fetchLineups()
  fetchCount()
})

// Infinite scroll (non-owner only)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (isOwner.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value && !loading.value) {
        fetchLineups()
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
