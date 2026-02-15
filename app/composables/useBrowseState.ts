// Composable to persist browse page specific state across navigation
// Uses Nuxt's useState for SSR-safe state that survives page navigation

import type { LineupWithRelations } from '~/types/database.types'

export interface BrowsePageState {
  browseMode: 'lineups' | 'collections'
  collectionsSearch: string
  scrollPosition: number
  // Cached data for back navigation
  lineups: LineupWithRelations[]
  hasMore: boolean
}

export function useBrowseState() {
  // useState persists state across page navigations in Nuxt
  const state = useState<BrowsePageState>('browse-page-state', () => ({
    browseMode: 'lineups',
    collectionsSearch: '',
    scrollPosition: 0,
    lineups: [],
    hasMore: true,
  }))

  const browseMode = computed(() => state.value.browseMode)
  const collectionsSearch = computed(() => state.value.collectionsSearch)
  const cachedLineups = computed(() => state.value.lineups)
  const cachedHasMore = computed(() => state.value.hasMore)

  const setBrowseMode = (mode: 'lineups' | 'collections') => {
    state.value.browseMode = mode
  }

  const setCollectionsSearch = (search: string) => {
    state.value.collectionsSearch = search
  }

  const saveScrollPosition = () => {
    if (import.meta.client) {
      state.value.scrollPosition = window.scrollY
    }
  }

  const restoreScrollPosition = () => {
    if (import.meta.client && state.value.scrollPosition > 0) {
      nextTick(() => {
        window.scrollTo(0, state.value.scrollPosition)
      })
    }
  }

  // Cache lineup data
  const setCachedLineups = (lineups: LineupWithRelations[], hasMore: boolean) => {
    state.value.lineups = lineups
    state.value.hasMore = hasMore
  }

  const clearCachedLineups = () => {
    state.value.lineups = []
    state.value.hasMore = true
  }

  return {
    state,
    browseMode,
    collectionsSearch,
    cachedLineups,
    cachedHasMore,
    setBrowseMode,
    setCollectionsSearch,
    saveScrollPosition,
    restoreScrollPosition,
    setCachedLineups,
    clearCachedLineups,
  }
}
