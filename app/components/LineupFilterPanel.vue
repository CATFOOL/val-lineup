<template>
  <div class="bg-gray-800/50 rounded-xl p-4 md:p-6 mb-8">
    <div class="flex flex-col md:flex-row gap-5 md:gap-8">
      <!-- Map Filter -->
      <div class="md:w-36 flex-shrink-0 md:border-r border-gray-700 md:pr-6">
        <h3 class="text-sm font-medium text-gray-400 mb-2 md:mb-3">Map</h3>
        <!-- Mobile: dropdown select -->
        <select
          class="md:hidden w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm border border-gray-600 focus:border-red-500 focus:outline-none"
          :value="filters.map"
          @change="$emit('update-filter', 'map', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Any</option>
          <option v-for="map in maps" :key="map.uuid" :value="map.uuid">
            {{ map.displayName }}
          </option>
        </select>
        <!-- Desktop: vertical list with scroll -->
        <div class="hidden md:block map-scroll-container space-y-1 max-h-[350px]">
          <button
            class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
            :class="
              filters.map === '' ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-700'
            "
            @click="$emit('update-filter', 'map', '')"
          >
            Any
          </button>
          <button
            v-for="map in maps"
            :key="map.uuid"
            class="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
            :class="
              filters.map === map.uuid ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-700'
            "
            @click="$emit('update-filter', 'map', map.uuid)"
          >
            {{ map.displayName }}
          </button>
        </div>
      </div>

      <!-- Right Side Filters -->
      <div class="flex-1 space-y-4 md:space-y-5">
        <!-- Search -->
        <div>
          <h3 class="text-sm font-medium text-gray-400 mb-2 md:mb-3">Search</h3>
          <input
            :value="filters.search"
            type="text"
            placeholder="Search by title or description..."
            class="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:border-red-500 focus:outline-none"
            @input="$emit('update-filter', 'search', ($event.target as HTMLInputElement).value)"
          >
        </div>

        <!-- Agent Filter -->
        <div>
          <h3 class="text-sm font-medium text-gray-400 mb-2 md:mb-3">Agent</h3>
          <div class="flex flex-wrap gap-1.5 md:gap-2">
            <button
              v-for="agent in agents"
              :key="agent.uuid"
              class="w-10 h-10 md:w-12 md:h-12 rounded-md overflow-hidden border-2 transition-all"
              :class="
                filters.agent === agent.uuid
                  ? 'border-red-500'
                  : 'border-transparent opacity-50 hover:opacity-100'
              "
              :title="agent.displayName"
              @click="$emit('select-agent', agent.uuid)"
            >
              <img
                :src="agent.displayIcon"
                :alt="agent.displayName"
                class="w-full h-full object-cover"
              >
            </button>
          </div>
        </div>

        <!-- Ability Filter -->
        <div v-if="selectedAgentAbilities.length">
          <h3 class="text-sm font-medium text-gray-400 mb-2 md:mb-3">Ability</h3>
          <div class="flex gap-1.5 md:gap-2">
            <button
              v-for="ability in selectedAgentAbilities"
              :key="ability.slot"
              class="w-10 h-10 md:w-12 md:h-12 rounded-md overflow-hidden border-2 transition-all bg-gray-700 flex items-center justify-center"
              :class="
                filters.abilities.includes(ability.slot)
                  ? 'border-red-500'
                  : 'border-transparent opacity-50 hover:opacity-100'
              "
              :title="`${abilitySlotToKey(ability.slot)} - ${ability.displayName}`"
              @click="$emit('toggle-ability', ability.slot)"
            >
              <img
                v-if="ability.displayIcon"
                :src="ability.displayIcon"
                :alt="ability.displayName"
                class="w-7 h-7 md:w-8 md:h-8 object-contain"
              >
              <span v-else class="text-white text-xs">{{ abilitySlotToKey(ability.slot) }}</span>
            </button>
          </div>
        </div>

        <!-- Site & Side Filters Row -->
        <div class="flex flex-col sm:flex-row gap-4 sm:gap-8">
          <!-- Site Filter -->
          <div>
            <h3 class="text-sm font-medium text-gray-400 mb-2 md:mb-3">Site</h3>
            <div class="flex gap-1.5">
              <button
                v-for="site in sites"
                :key="site.value"
                class="px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                :class="
                  filters.site === site.value
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                "
                @click="$emit('toggle-site', site.value)"
              >
                {{ site.label }}
              </button>
            </div>
          </div>

          <!-- Side Filter -->
          <div>
            <h3 class="text-sm font-medium text-gray-400 mb-2 md:mb-3">Side</h3>
            <div class="flex gap-1.5">
              <button
                v-for="side in sides"
                :key="side.value"
                class="px-3 md:px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
                :class="
                  filters.side === side.value
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                "
                @click="$emit('toggle-side', side.value)"
              >
                {{ side.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LineupFilters } from '~/composables/useLineupFilters'
import type { ValorantAgent, ValorantAbility, ValorantMap } from '~/composables/useValorantApi'
import { sites, sides } from '~/composables/useLineupFilters'

defineProps<{
  filters: LineupFilters
  agents?: ValorantAgent[] | null
  maps?: ValorantMap[] | null
  selectedAgentAbilities: ValorantAbility[]
  abilitySlotToKey: (slot: string) => string
}>()

defineEmits<{
  'update-filter': [key: keyof LineupFilters, value: LineupFilters[keyof LineupFilters]]
  'select-agent': [uuid: string]
  'toggle-ability': [slot: string]
  'toggle-site': [value: string]
  'toggle-side': [value: string]
}>()
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
