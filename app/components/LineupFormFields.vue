<template>
  <div class="bg-gray-800 rounded-lg p-6 space-y-4">
    <h2 class="text-xl font-semibold text-white mb-4">Basic Information</h2>

    <div>
      <label class="block text-gray-300 mb-2">Title *</label>
      <input
        v-model="form.title"
        type="text"
        required
        class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
        placeholder="e.g., Sova Recon Arrow from A Site to B Main"
      />
    </div>

    <div>
      <label class="block text-gray-300 mb-2">Description</label>
      <textarea
        v-model="form.description"
        rows="3"
        class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
        placeholder="Describe the lineup, tips, or any important notes..."
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-gray-300 mb-2">Agent *</label>
        <select
          v-model="form.agent_uuid"
          required
          class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
        >
          <option value="">Select Agent</option>
          <option v-for="agent in agents" :key="agent.uuid" :value="agent.uuid">
            {{ agent.displayName }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-gray-300 mb-2">Map *</label>
        <select
          v-model="form.map_uuid"
          required
          class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
        >
          <option value="">Select Map</option>
          <option v-for="map in maps" :key="map.uuid" :value="map.uuid">
            {{ map.displayName }}
          </option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
      <div>
        <label class="block text-gray-300 mb-2">Side</label>
        <select
          v-model="form.side"
          class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
        >
          <option value="">Any / Not Specified</option>
          <option value="attack">Attack</option>
          <option value="defense">Defense</option>
        </select>
      </div>

      <div>
        <label class="block text-gray-300 mb-2">Site</label>
        <select
          v-model="form.site"
          class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
        >
          <option value="">Any</option>
          <option value="A">Site A</option>
          <option value="B">Site B</option>
          <option value="C">Site C</option>
          <option value="Mid">Mid</option>
        </select>
      </div>

      <div>
        <label class="block text-gray-300 mb-2">Ability</label>
        <select
          v-model="form.ability"
          class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
        >
          <option value="">Any / Not Specified</option>
          <option v-for="ability in selectedAgentAbilities" :key="ability.slot" :value="ability.slot">
            {{ abilitySlotToKey(ability.slot) }} - {{ ability.displayName }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ValorantAgent, ValorantAbility } from '~/composables/useValorantApi'
import type { LineupFormData } from '~/composables/useLineupForm'

defineProps<{
  form: LineupFormData
  agents: ValorantAgent[] | null | undefined
  maps: { uuid: string; displayName: string }[] | null | undefined
  selectedAgentAbilities: ValorantAbility[]
  abilitySlotToKey: (slot: string) => string
}>()
</script>
