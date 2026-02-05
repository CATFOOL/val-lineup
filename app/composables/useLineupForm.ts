import type { ValorantAgent, ValorantAbility, ValorantMap } from './useValorantApi'

export interface LineupFormData {
  title: string
  description: string
  agent_uuid: string
  map_uuid: string
  side: '' | 'attack' | 'defense'
  site: string
  ability: string
  is_published: boolean
}

export interface NewMediaItem {
  id: string
  file: File
  type: 'image' | 'video'
  preview: string
  description: string
  is_cover: boolean
}

export const useLineupForm = () => {
  const { getAgents, getMaps, abilitySlotToKey } = useValorantApi()

  // Form state with defaults
  const form = reactive<LineupFormData>({
    title: '',
    description: '',
    agent_uuid: '',
    map_uuid: '',
    side: '',
    site: '',
    ability: '',
    is_published: true
  })

  // Fetch agents and maps
  const { data: agents } = useAsyncData('valorant-agents', () => getAgents())
  const { data: maps } = useAsyncData('valorant-maps', () => getMaps())

  // Computed abilities for selected agent (sorted by key order: C Q E X)
  const selectedAgentAbilities = computed<ValorantAbility[]>(() => {
    if (!form.agent_uuid || !agents.value) return []
    const agent = agents.value.find(a => a.uuid === form.agent_uuid)
    const abilities = agent?.abilities.filter(a => a.slot !== 'Passive') || []
    const slotOrder: Record<string, number> = {
      'Grenade': 0,   // C
      'Ability1': 1,  // Q
      'Ability2': 2,  // E
      'Ultimate': 3   // X
    }
    return abilities.sort((a, b) => (slotOrder[a.slot] ?? 99) - (slotOrder[b.slot] ?? 99))
  })

  // Reset ability when agent changes
  watch(() => form.agent_uuid, () => {
    form.ability = ''
  })

  // Process files into media items (returns items, caller decides where to store)
  const processFiles = (files: FileList | File[], existingHasCover = false): NewMediaItem[] => {
    const items: NewMediaItem[] = []
    const fileArray = Array.from(files)
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]!
      const type = file.type.startsWith('video/') ? 'video' : 'image'
      items.push({
        id: `media-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        type,
        preview: URL.createObjectURL(file),
        description: '',
        is_cover: !existingHasCover && i === 0
      })
    }
    return items
  }

  // Cleanup helper
  const revokePreviewUrl = (url: string) => {
    URL.revokeObjectURL(url)
  }

  return {
    form,
    agents,
    maps,
    selectedAgentAbilities,
    abilitySlotToKey,
    processFiles,
    revokePreviewUrl
  }
}
