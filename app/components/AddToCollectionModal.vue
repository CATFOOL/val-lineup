<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" @click="emit('close')" />
      <div class="relative bg-gray-800 rounded-lg w-full max-w-4xl mx-4 shadow-xl max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="p-6 border-b border-gray-700 flex-shrink-0">
          <h3 class="text-lg font-semibold text-white">Add Lineups</h3>
        </div>

        <!-- Dual Pane Content -->
        <div class="flex flex-1 min-h-0">
          <!-- Left Pane: My Lineups -->
          <div class="w-1/2 border-r border-gray-700 flex flex-col">
            <div class="p-4 border-b border-gray-700 flex-shrink-0">
              <h4 class="text-sm font-medium text-gray-400 mb-2">My Lineups</h4>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search lineups..."
                class="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-2">
              <div v-if="loadingLineups" class="text-gray-400 text-center py-4 text-sm">Loading lineups...</div>
              <template v-else>
                <div
                  v-for="lineup in availableLineups"
                  :key="lineup.id"
                  @click="addLineup(lineup)"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-gray-700 cursor-pointer transition-colors"
                  :class="{ 'opacity-50 pointer-events-none': lineup.adding || addedIds.has(lineup.id) }"
                >
                  <!-- Thumbnail -->
                  <div class="w-16 h-10 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                    <img
                      v-if="lineup.thumbnail"
                      :src="lineup.thumbnail"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-sm truncate">{{ lineup.title }}</p>
                    <p class="text-gray-500 text-xs truncate">{{ lineup.agentName }} · {{ lineup.mapName }}</p>
                  </div>
                  <div v-if="addedIds.has(lineup.id)" class="text-green-400 flex-shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  <div v-else class="text-gray-500 flex-shrink-0">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                </div>
                <div v-if="!availableLineups.length" class="text-gray-400 text-center py-4 text-sm">
                  No lineups found.
                </div>
              </template>
            </div>
          </div>

          <!-- Right Pane: In Collection -->
          <div class="w-1/2 flex flex-col">
            <div class="p-4 border-b border-gray-700 flex-shrink-0">
              <h4 class="text-sm font-medium text-gray-400">In Collection ({{ collectionLineups.length }})</h4>
            </div>
            <div class="flex-1 overflow-y-auto p-4 space-y-2">
              <div v-if="loadingCollection" class="text-gray-400 text-center py-4 text-sm">Loading...</div>
              <template v-else>
                <div
                  v-for="lineup in collectionLineups"
                  :key="lineup.id"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-md bg-gray-900 transition-colors"
                  :class="{ 'opacity-50 pointer-events-none': lineup.removing }"
                >
                  <!-- Thumbnail -->
                  <div class="w-16 h-10 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                    <img
                      v-if="lineup.thumbnail"
                      :src="lineup.thumbnail"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-white text-sm truncate">{{ lineup.title }}</p>
                    <p class="text-gray-500 text-xs truncate">{{ lineup.agentName }} · {{ lineup.mapName }}</p>
                  </div>
                  <button
                    @click="removeLineup(lineup)"
                    class="text-gray-400 hover:text-red-400 flex-shrink-0 transition-colors"
                    title="Remove from collection"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
                <div v-if="!collectionLineups.length" class="text-gray-400 text-center py-4 text-sm">
                  No lineups added yet.
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-700 flex-shrink-0">
          <button
            @click="emit('close')"
            class="w-full bg-gray-700 text-gray-200 py-2.5 rounded-md hover:bg-gray-600 text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  collectionId: string
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const supabase = useSupabaseClient<any>()
const user = useSupabaseUser()
const { getAgents, getMaps } = useValorantApi()
const currentUserId = computed(() => (user.value as any)?.id ?? (user.value as any)?.sub)

const searchQuery = ref('')
const loadingLineups = ref(false)
const loadingCollection = ref(false)

interface LineupItem {
  id: string
  title: string
  thumbnail: string | null
  agentName: string
  mapName: string
  adding?: boolean
  removing?: boolean
}

const allMyLineups = ref<LineupItem[]>([])
const collectionLineups = ref<LineupItem[]>([])
const addedIds = computed(() => new Set(collectionLineups.value.map(l => l.id)))

// Agents/maps for display names
const { data: agents } = await useAsyncData('valorant-agents', () => getAgents())
const { data: maps } = await useAsyncData('valorant-maps', () => getMaps())

const agentsMap = computed(() => {
  if (!agents.value) return {} as Record<string, string>
  return agents.value.reduce((acc, a) => { acc[a.uuid] = a.displayName; return acc }, {} as Record<string, string>)
})

const mapsMap = computed(() => {
  if (!maps.value) return {} as Record<string, string>
  return maps.value.reduce((acc, m) => { acc[m.uuid] = m.displayName; return acc }, {} as Record<string, string>)
})

function toLineupItem(lineup: any): LineupItem {
  return {
    id: lineup.id,
    title: lineup.title,
    thumbnail: getLineupThumbnail(lineup.media || []),
    agentName: agentsMap.value[lineup.agent_uuid] || '',
    mapName: mapsMap.value[lineup.map_uuid] || ''
  }
}

const availableLineups = computed(() => {
  if (!searchQuery.value) return allMyLineups.value
  const q = searchQuery.value.toLowerCase()
  return allMyLineups.value.filter(l =>
    l.title.toLowerCase().includes(q) ||
    l.agentName.toLowerCase().includes(q) ||
    l.mapName.toLowerCase().includes(q)
  )
})

async function fetchMyLineups() {
  if (!currentUserId.value) return
  loadingLineups.value = true

  const { data } = await supabase
    .from('lineups')
    .select('id, title, agent_uuid, map_uuid, media:lineup_media(url, sort_order, is_cover)')
    .eq('user_id', currentUserId.value)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  allMyLineups.value = (data ?? []).map(toLineupItem)
  loadingLineups.value = false
}

async function fetchCollectionLineups() {
  loadingCollection.value = true

  const { data } = await supabase
    .from('collection_lineups')
    .select(`
      lineup_id,
      lineups:lineup_id!inner(
        id, title, agent_uuid, map_uuid,
        media:lineup_media(url, sort_order, is_cover)
      )
    `)
    .eq('collection_id', props.collectionId)
    .order('sort_order', { ascending: true })

  collectionLineups.value = (data ?? [])
    .map((row: any) => row.lineups)
    .filter(Boolean)
    .map(toLineupItem)

  loadingCollection.value = false
}

async function addLineup(lineup: LineupItem) {
  if (addedIds.value.has(lineup.id)) return
  lineup.adding = true

  const sortOrder = collectionLineups.value.length
  const { error } = await supabase
    .from('collection_lineups')
    .insert({ collection_id: props.collectionId, lineup_id: lineup.id, sort_order: sortOrder })

  if (!error) {
    collectionLineups.value.push({ ...lineup, adding: false, removing: false })
    emit('updated')
  }

  lineup.adding = false
}

async function removeLineup(lineup: LineupItem) {
  lineup.removing = true

  const { error } = await supabase
    .from('collection_lineups')
    .delete()
    .eq('collection_id', props.collectionId)
    .eq('lineup_id', lineup.id)

  if (!error) {
    collectionLineups.value = collectionLineups.value.filter(l => l.id !== lineup.id)
    emit('updated')
  }

  lineup.removing = false
}

watch(() => props.show, (val) => {
  if (val) {
    searchQuery.value = ''
    fetchMyLineups()
    fetchCollectionLineups()
  }
})
</script>
