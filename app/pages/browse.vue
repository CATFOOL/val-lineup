<template>
  <div>
    <!-- Browse Mode Toggle -->
    <div class="flex gap-2 mb-8">
      <button
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="
          browseMode === 'lineups'
            ? 'bg-red-500 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
        "
        @click="switchMode('lineups')"
      >
        Lineups
      </button>
      <button
        class="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        :class="
          browseMode === 'collections'
            ? 'bg-red-500 text-white'
            : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
        "
        @click="switchMode('collections')"
      >
        Collections
      </button>
    </div>

    <!-- Filter Panel (lineups only) -->
    <LineupFilterPanel
      v-if="browseMode === 'lineups'"
      :filters="filters"
      :agents="agents"
      :maps="maps"
      :selected-agent-abilities="selectedAgentAbilities"
      :ability-slot-to-key="abilitySlotToKey"
      @update-filter="updateFilter"
      @select-agent="selectAgent"
      @toggle-ability="toggleAbility"
      @toggle-site="toggleSite"
      @toggle-side="toggleSide"
    />

    <!-- Lineups Results -->
    <div v-if="browseMode === 'lineups'">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">
          Top Results
          <span v-if="lineups.length" class="text-gray-400 font-normal"
            >({{ lineups.length }}{{ hasMore ? "+" : "" }} results)</span
          >
        </h2>
        <button
          v-if="hasActiveFilters"
          class="text-sm text-gray-400 hover:text-white"
          @click="clearFilters"
        >
          Clear filters
        </button>
      </div>

      <div v-if="loading && !lineups.length" class="text-gray-400">
        Loading lineups...
      </div>
      <div
        v-else-if="lineups.length"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <LineupCard
          v-for="lineup in lineups"
          :key="lineup.id"
          :lineup="lineup"
          :agent="agentsMap[lineup.agent_uuid]"
          :map="mapsMap[lineup.map_uuid]"
        />
      </div>
      <div v-else class="text-gray-400">
        No lineups found. Try adjusting your filters.
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinel" class="h-10 flex items-center justify-center mt-4">
        <span v-if="loading && lineups.length" class="text-gray-500 text-sm"
          >Loading more...</span
        >
      </div>
    </div>

    <!-- Collections Results -->
    <div v-else>
      <!-- Search for collections -->
      <div class="bg-gray-800/50 rounded-xl p-6 mb-8">
        <h3 class="text-sm font-medium text-gray-400 mb-3">Search</h3>
        <input
          :value="collectionsSearch"
          type="text"
          placeholder="Search collections by title..."
          class="w-full px-3 py-2 rounded-md bg-gray-700 text-white text-sm placeholder-gray-500 border border-gray-600 focus:border-red-500 focus:outline-none"
          @input="
            setCollectionsSearch(($event.target as HTMLInputElement).value)
          "
        />
      </div>

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">
          Collections
          <span
            v-if="browseCollections.length"
            class="text-gray-400 font-normal"
            >({{ browseCollections.length
            }}{{ collectionsHasMore ? "+" : "" }})</span
          >
        </h2>
      </div>

      <div
        v-if="collectionsLoading && !browseCollections.length"
        class="text-gray-400"
      >
        Loading collections...
      </div>
      <div
        v-else-if="browseCollections.length"
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <CollectionCard
          v-for="col in browseCollections"
          :key="col.id"
          :collection="col"
        />
      </div>
      <div v-else class="text-gray-400">No collections found.</div>

      <!-- Infinite scroll sentinel -->
      <div
        ref="collectionsSentinel"
        class="h-10 flex items-center justify-center mt-4"
      >
        <span
          v-if="collectionsLoading && browseCollections.length"
          class="text-gray-500 text-sm"
          >Loading more...</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  LineupWithRelations,
  CollectionWithRelations,
  RawLineupWithCounts,
  RawCollectionWithCounts,
} from "~/types/database.types";

const PAGE_SIZE = 20;

const supabase = useSupabaseClient();

// Use shared filter composable with persistence
const {
  filters,
  agents,
  maps,
  agentsMap,
  mapsMap,
  selectedAgentAbilities,
  updateFilter,
  selectAgent,
  toggleAbility,
  toggleSite,
  toggleSide,
  hasActiveFilters,
  clearFilters,
  applyFiltersToQuery,
  abilitySlotToKey,
} = useLineupFilters({
  persistKey: "browse-filters",
  onFiltersChange: () => {
    clearCachedLineups();
    fetchLineups(true);
  },
});

// Use browse page state composable (scroll, cache, mode)
const {
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
} = useBrowseState();

// Track deleted lineups to remove from cache
const { deletedLineupIds, updatedLineupIds, hasNewLineup } = useLineupEvents();

// Collections state (not persisted - will refetch)
const browseCollections = ref<
  (CollectionWithRelations & { cover_lineups?: unknown[] })[]
>([]);
const collectionsLoading = ref(false);
const collectionsHasMore = ref(true);
const collectionsSentinel = ref<HTMLElement | null>(null);

function switchMode(mode: "lineups" | "collections") {
  setBrowseMode(mode);
  if (mode === "collections" && !browseCollections.value.length) {
    fetchBrowseCollections(true);
  }
}

async function fetchBrowseCollections(reset = false) {
  if (collectionsLoading.value) return;
  if (!reset && !collectionsHasMore.value) return;

  collectionsLoading.value = true;

  if (reset) {
    browseCollections.value = [];
    collectionsHasMore.value = true;
  }

  const from = browseCollections.value.length;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("collections")
    .select(
      `
      *,
      profile:profiles(*),
      lineups_count:collection_lineups(count),
      subscribers_count:collection_subscriptions(count),
      cover_lineups:collection_lineups(
        lineups:lineup_id!inner(
          media:lineup_media(url, sort_order, is_cover)
        )
      )
    `,
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (collectionsSearch.value) {
    const pattern = `%${collectionsSearch.value}%`;
    query = query.ilike("title", pattern);
  }

  const { data } = await query;

  const items = (data ?? []).map(
    (item: RawCollectionWithCounts & Record<string, unknown>) => ({
      ...item,
      lineups_count: item.lineups_count?.[0]?.count ?? 0,
      subscribers_count: item.subscribers_count?.[0]?.count ?? 0,
      cover_lineups: (item.cover_lineups ?? [])
        .map((cl: { lineups: unknown }) => cl.lineups)
        .filter(Boolean)
        .slice(0, 4),
    }),
  ) as (CollectionWithRelations & { cover_lineups?: unknown[] })[];

  browseCollections.value.push(...items);
  collectionsHasMore.value = items.length === PAGE_SIZE;
  collectionsLoading.value = false;
}

// Debounced collections search
let collectionsSearchTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => collectionsSearch.value,
  () => {
    if (collectionsSearchTimer) clearTimeout(collectionsSearchTimer);
    collectionsSearchTimer = setTimeout(
      () => fetchBrowseCollections(true),
      300,
    );
  },
);

// Pagination state - use cached data if available
const lineups = ref<LineupWithRelations[]>(
  cachedLineups.value.length ? [...cachedLineups.value] : [],
);
const loading = ref(false);
const hasMore = ref(cachedLineups.value.length ? cachedHasMore.value : true);
const sentinel = ref<HTMLElement | null>(null);

async function fetchLineups(reset = false) {
  if (loading.value) return;
  if (!reset && !hasMore.value) return;

  loading.value = true;

  if (reset) {
    lineups.value = [];
    hasMore.value = true;
  }

  const from = lineups.value.length;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("lineups")
    .select(
      `
      *,
      profile:profiles(*),
      media:lineup_media(*),
      likes_count:lineup_likes(count),
      bookmarks_count:lineup_bookmarks(count)
    `,
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  // Apply filters using the composable helper
  query = applyFiltersToQuery(query);

  const { data } = await query;

  const items = (data ?? []).map((item: RawLineupWithCounts) => ({
    ...item,
    likes_count: item.likes_count?.[0]?.count ?? 0,
    bookmarks_count: item.bookmarks_count?.[0]?.count ?? 0,
  })) as LineupWithRelations[];

  lineups.value.push(...items);
  hasMore.value = items.length === PAGE_SIZE;
  loading.value = false;
}

// Initial fetch only if no cached data
if (!cachedLineups.value.length) {
  await fetchLineups();
}

// Debounced search (separate from other filters)
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => filters.value.search,
  () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      clearCachedLineups();
      fetchLineups(true);
    }, 300);
  },
);

// Infinite scroll with IntersectionObserver
let observer: IntersectionObserver | null = null;
let collectionsObserver: IntersectionObserver | null = null;

onMounted(() => {
  // Restore scroll position when returning to this page
  restoreScrollPosition();

  // Filter out any deleted lineups from cache
  if (deletedLineupIds.value.size > 0 && lineups.value.length > 0) {
    lineups.value = lineups.value.filter(
      (l) => !deletedLineupIds.value.has(l.id),
    );
  }

  // If any lineup was updated or created, clear cache and refetch to get fresh data
  if (updatedLineupIds.value.size > 0 || hasNewLineup.value) {
    clearCachedLineups();
    lineups.value = [];
    hasMore.value = true;
    fetchLineups();
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value && !loading.value) {
        fetchLineups();
      }
    },
    { rootMargin: "200px" },
  );
  if (sentinel.value) observer.observe(sentinel.value);

  collectionsObserver = new IntersectionObserver(
    (entries) => {
      if (
        entries[0]?.isIntersecting &&
        collectionsHasMore.value &&
        !collectionsLoading.value
      ) {
        fetchBrowseCollections();
      }
    },
    { rootMargin: "200px" },
  );
  if (collectionsSentinel.value)
    collectionsObserver.observe(collectionsSentinel.value);
});

// Save scroll position and cache data before leaving
onBeforeUnmount(() => {
  saveScrollPosition();
  setCachedLineups(lineups.value, hasMore.value);
});

onUnmounted(() => {
  observer?.disconnect();
  collectionsObserver?.disconnect();
});
</script>
