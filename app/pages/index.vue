<template>
  <div>
    <section class="text-center py-16">
      <h1 class="text-5xl font-bold mb-4">
        <span class="text-red-500">VALORANT</span>
        <span class="text-white"> LINEUPS</span>
      </h1>
      <p class="text-gray-400 text-xl mb-8">
        Discover and share the best lineups for every agent and map
      </p>
      <div class="flex justify-center gap-4">
        <NuxtLink
          to="/browse"
          class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-md font-semibold transition-colors"
        >
          Browse Lineups
        </NuxtLink>
        <NuxtLink
          to="/create"
          class="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-md font-semibold transition-colors"
        >
          Create Lineup
        </NuxtLink>
      </div>
    </section>

    <section class="py-8">
      <h2 class="text-2xl font-bold text-white mb-6">Latest Lineups</h2>
      <div v-if="pending" class="text-gray-400">Loading...</div>
      <div v-else-if="lineups?.length" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <LineupCard
          v-for="lineup in lineups"
          :key="lineup.id"
          :lineup="lineup"
          :agent="agentsMap[lineup.agent_uuid]"
          :map="mapsMap[lineup.map_uuid]"
        />
      </div>
      <div v-else class="text-gray-400">No lineups yet. Be the first to create one!</div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { LineupWithRelations } from '~/types/database.types'

const supabase = useSupabaseClient<any>()
const { getAgents, getMaps } = useValorantApi()

// Fetch agents and maps from Valorant API
const { data: agents } = await useAsyncData('valorant-agents', () => getAgents())
const { data: maps } = await useAsyncData('valorant-maps', () => getMaps())

// Create maps for quick lookup
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

// Fetch lineups from Supabase
const { data: lineups, pending } = await useAsyncData('latest-lineups', async () => {
  const { data } = await supabase
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
    .limit(20)

  return (data ?? []).map((item: any) => ({
    ...item,
    likes_count: item.likes_count?.[0]?.count ?? 0,
    bookmarks_count: item.bookmarks_count?.[0]?.count ?? 0
  })) as LineupWithRelations[]
})
</script>
