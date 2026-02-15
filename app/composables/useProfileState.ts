// Composable to persist profile page state across navigation
// Uses Nuxt's useState for SSR-safe state that survives page navigation

import type { LineupWithRelations } from "~/types/database.types";

export interface ProfilePageState {
  activeTab: "lineups" | "liked" | "bookmarked" | "collections" | "subscribed";
  scrollPosition: number;
  // Cached data for back navigation
  lineups: LineupWithRelations[];
  hasMore: boolean;
}

export function useProfileState(username: string) {
  // Use username as part of the key to have separate state per profile
  const stateKey = `profile-page-state-${username}`;

  const state = useState<ProfilePageState>(stateKey, () => ({
    activeTab: "lineups",
    scrollPosition: 0,
    lineups: [],
    hasMore: true,
  }));

  const activeTab = computed(() => state.value.activeTab);
  const cachedLineups = computed(() => state.value.lineups);
  const cachedHasMore = computed(() => state.value.hasMore);

  const setActiveTab = (tab: ProfilePageState["activeTab"]) => {
    state.value.activeTab = tab;
  };

  const saveScrollPosition = () => {
    if (import.meta.client) {
      state.value.scrollPosition = window.scrollY;
    }
  };

  const restoreScrollPosition = () => {
    if (import.meta.client && state.value.scrollPosition > 0) {
      nextTick(() => {
        window.scrollTo(0, state.value.scrollPosition);
      });
    }
  };

  const setCachedLineups = (
    lineups: LineupWithRelations[],
    hasMore: boolean,
  ) => {
    state.value.lineups = lineups;
    state.value.hasMore = hasMore;
  };

  const clearCachedLineups = () => {
    state.value.lineups = [];
    state.value.hasMore = true;
  };

  return {
    state,
    activeTab,
    cachedLineups,
    cachedHasMore,
    setActiveTab,
    saveScrollPosition,
    restoreScrollPosition,
    setCachedLineups,
    clearCachedLineups,
  };
}
