// Shared composable for lineup filter state and logic
// Can be used with or without state persistence

export interface LineupFilters {
  search: string
  map: string
  agent: string
  abilities: string[]
  site: string
  side: string
}

export const defaultFilters: LineupFilters = {
  search: '',
  map: '',
  agent: '',
  abilities: [],
  site: '',
  side: ''
}

export const sites = [
  { value: '', label: 'All' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'Mid', label: 'Mid' }
]

export const sides = [
  { value: '', label: 'All' },
  { value: 'defense', label: 'Defense' },
  { value: 'attack', label: 'Attack' }
]

export interface UseLineupFiltersOptions {
  // Optional key for useState persistence (if not provided, uses local reactive)
  persistKey?: string
  // Callback when filters change
  onFiltersChange?: () => void
}

export function useLineupFilters(options: UseLineupFiltersOptions = {}) {
  const { persistKey, onFiltersChange } = options

  // Use useState for persistence if key provided, otherwise use reactive
  const filters = persistKey
    ? useState<LineupFilters>(persistKey, () => ({ ...defaultFilters }))
    : ref<LineupFilters>({ ...defaultFilters })

  const { getAgents, getMaps, abilitySlotToKey } = useValorantApi()

  // Fetch agents and maps
  const { data: agents } = useAsyncData('valorant-agents', () => getAgents())
  const { data: maps } = useAsyncData('valorant-maps', () => getMaps())

  // Create lookup maps
  const agentsMap = computed(() => {
    if (!agents.value) return {}
    return agents.value.reduce((acc, agent) => {
      acc[agent.uuid] = agent
      return acc
    }, {} as Record<string, (typeof agents.value)[0]>)
  })

  const mapsMap = computed(() => {
    if (!maps.value) return {}
    return maps.value.reduce((acc, map) => {
      acc[map.uuid] = map
      return acc
    }, {} as Record<string, (typeof maps.value)[0]>)
  })

  // Get abilities for selected agent
  const selectedAgentAbilities = computed(() => {
    const f = filters.value
    if (!f.agent) return []
    const agent = agentsMap.value[f.agent]
    if (!agent) return []
    return agent.abilities.filter(a => a.slot !== 'Passive')
  })

  // Update a single filter field
  const updateFilter = <K extends keyof LineupFilters>(key: K, value: LineupFilters[K]) => {
    filters.value[key] = value
  }

  // Clear abilities when agent changes
  watch(
    () => filters.value.agent,
    () => {
      filters.value.abilities = []
    }
  )

  // Toggle agent selection
  const selectAgent = (uuid: string) => {
    updateFilter('agent', filters.value.agent === uuid ? '' : uuid)
  }

  // Toggle ability selection
  const toggleAbility = (slot: string) => {
    const abilities = [...filters.value.abilities]
    const index = abilities.indexOf(slot)
    if (index === -1) {
      abilities.push(slot)
    } else {
      abilities.splice(index, 1)
    }
    updateFilter('abilities', abilities)
  }

  // Toggle site selection
  const toggleSite = (value: string) => {
    updateFilter('site', filters.value.site === value ? '' : value)
  }

  // Toggle side selection
  const toggleSide = (value: string) => {
    updateFilter('side', filters.value.side === value ? '' : value)
  }

  // Check if any filters are active
  const hasActiveFilters = computed(() => {
    const f = filters.value
    return !!(f.search || f.map || f.agent || f.abilities.length || f.site || f.side)
  })

  // Clear all filters
  const clearFilters = () => {
    filters.value = { ...defaultFilters }
  }

  // Apply filters to a Supabase query
  const applyFiltersToQuery = <T>(query: T): T => {
    const f = filters.value
    let q = query as any
    if (f.map) q = q.eq('map_uuid', f.map)
    if (f.agent) q = q.eq('agent_uuid', f.agent)
    if (f.abilities.length) q = q.in('ability', f.abilities)
    if (f.site) q = q.eq('site', f.site)
    if (f.side) q = q.eq('side', f.side)
    if (f.search) {
      const pattern = `%${f.search}%`
      q = q.or(`title.ilike.${pattern},description.ilike.${pattern}`)
    }
    return q as T
  }

  // Watch for filter changes (excluding search which should be debounced)
  watch(
    () => [
      filters.value.map,
      filters.value.agent,
      filters.value.abilities.length,
      filters.value.site,
      filters.value.side
    ],
    () => {
      onFiltersChange?.()
    }
  )

  return {
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
  }
}
