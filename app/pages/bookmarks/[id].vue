<template>
  <div v-if="folder">
    <div class="flex items-center justify-between mb-6">
      <button class="text-gray-400 hover:text-white" @click="$router.back()">
        ← Back
      </button>
      <div class="flex items-center gap-2">
        <button
          v-if="!folder.is_default"
          type="button"
          class="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
          @click="showRenameModal = true"
        >
          Rename
        </button>
        <button
          v-if="!folder.is_default"
          type="button"
          class="px-4 py-2 rounded-md bg-red-900/80 text-red-200 hover:bg-red-800 transition-colors"
          @click="confirmDelete"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Folder Header -->
    <div class="bg-gray-800/50 rounded-xl p-6 mb-8">
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-2xl font-bold text-white">{{ folder.title }}</h1>
        <span
          v-if="folder.is_default"
          class="text-xs bg-red-500 text-white px-2 py-0.5 rounded"
          >Default</span
        >
      </div>
      <div class="flex items-center gap-4 text-sm text-gray-400">
        <span
          >{{ lineupsCount }}
          {{ lineupsCount === 1 ? "lineup" : "lineups" }}</span
        >
        <span>Created {{ formatDate(folder.created_at) }}</span>
      </div>
    </div>

    <!-- Lineups Grid -->
    <div v-if="loading && !lineups.length" class="text-gray-400">
      Loading lineups...
    </div>
    <div
      v-else-if="lineups.length"
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
      <LineupCard
        v-for="lineup in lineups"
        :key="lineup.id"
        :lineup="lineup"
        :agent="agentsMap[lineup.agent_uuid]"
        :map="mapsMap[lineup.map_uuid]"
      />
    </div>
    <div v-else class="text-gray-400">No lineups in this folder yet.</div>

    <!-- Infinite scroll sentinel -->
    <div ref="sentinel" class="h-10 flex items-center justify-center mt-4">
      <span v-if="loading && lineups.length" class="text-gray-500 text-sm"
        >Loading more...</span
      >
    </div>
  </div>
  <div v-else-if="pending" class="text-gray-400">Loading folder...</div>
  <div v-else class="text-gray-400">Folder not found or access denied.</div>

  <!-- Rename Modal -->
  <Teleport to="body">
    <div
      v-if="showRenameModal"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/60"
        @click="showRenameModal = false"
      />
      <div
        class="relative bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
      >
        <h3 class="text-lg font-semibold text-white mb-4">Rename Folder</h3>
        <input
          v-model="newTitle"
          type="text"
          placeholder="Folder name..."
          class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none mb-4"
          @keyup.enter="executeRename"
        />
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
            @click="showRenameModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="!newTitle.trim() || renameLoading"
            class="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            @click="executeRename"
          >
            {{ renameLoading ? "Saving..." : "Save" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Delete Confirmation Modal -->
  <Teleport to="body">
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-black/60"
        @click="showDeleteModal = false"
      />
      <div
        class="relative bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl"
      >
        <h3 class="text-lg font-semibold text-white mb-2">Delete Folder</h3>
        <p class="text-gray-400 mb-6">
          Are you sure you want to delete this folder? The lineups inside will
          not be deleted.
        </p>
        <div
          v-if="deleteError"
          class="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm"
        >
          {{ deleteError }}
        </div>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-md bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors"
            :disabled="deleteLoading"
            @click="showDeleteModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-500 transition-colors flex items-center gap-2"
            :disabled="deleteLoading"
            @click="executeDelete"
          >
            <svg
              v-if="deleteLoading"
              class="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type {
  LineupWithRelations,
  BookmarkFolder,
  RawLineupWithCounts,
} from "~/types/database.types";

definePageMeta({ middleware: "auth" });

const PAGE_SIZE = 20;

const route = useRoute();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const { getAgents, getMaps } = useValorantApi();

const folderId = route.params.id as string;
const currentUserId = computed(() => user.value?.id);

const showDeleteModal = ref(false);
const deleteLoading = ref(false);
const deleteError = ref<string | null>(null);
const showRenameModal = ref(false);
const renameLoading = ref(false);
const newTitle = ref("");

// Fetch folder
const {
  data: folder,
  pending,
  refresh: refreshFolder,
} = await useAsyncData(`bookmark-folder-${folderId}`, async () => {
  if (!currentUserId.value) return null;
  const { data } = await supabase
    .from("bookmark_folders")
    .select("*")
    .eq("id", folderId)
    .eq("user_id", currentUserId.value)
    .single();
  return data as BookmarkFolder | null;
});

// Watch for newTitle initialization
watch(
  folder,
  (f) => {
    if (f) newTitle.value = f.title;
  },
  { immediate: true },
);

// Fetch agents and maps
const { data: agents } = await useAsyncData("valorant-agents", () =>
  getAgents(),
);
const { data: maps } = await useAsyncData("valorant-maps", () => getMaps());

const agentsMap = computed(() => {
  if (!agents.value) return {};
  return agents.value.reduce(
    (acc, agent) => {
      acc[agent.uuid] = agent;
      return acc;
    },
    {} as Record<string, (typeof agents.value)[0]>,
  );
});

const mapsMap = computed(() => {
  if (!maps.value) return {};
  return maps.value.reduce(
    (acc, map) => {
      acc[map.uuid] = map;
      return acc;
    },
    {} as Record<string, (typeof maps.value)[0]>,
  );
});

// Fetch lineups in folder with pagination
const lineups = ref<LineupWithRelations[]>([]);
const loading = ref(false);
const hasMore = ref(true);
const lineupsCount = ref(0);
const sentinel = ref<HTMLElement | null>(null);

async function fetchLineups(reset = false) {
  if (!folder.value) return;
  if (loading.value) return;
  if (!reset && !hasMore.value) return;

  loading.value = true;

  if (reset) {
    lineups.value = [];
    hasMore.value = true;
  }

  const from = lineups.value.length;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("lineup_bookmarks")
    .select(
      `
      lineup_id,
      lineups:lineup_id!inner(
        *,
        profile:profiles(*),
        media:lineup_media(*),
        likes_count:lineup_likes(count),
        bookmarks_count:lineup_bookmarks(count)
      )
    `,
    )
    .eq("folder_id", folder.value.id)
    .eq("user_id", currentUserId.value)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    loading.value = false;
    return;
  }

  const items = (data ?? [])
    .map((row: { lineups: RawLineupWithCounts }) => row.lineups)
    .filter(Boolean)
    .map((item: RawLineupWithCounts) => ({
      ...item,
      likes_count: item.likes_count?.[0]?.count ?? 0,
      bookmarks_count: item.bookmarks_count?.[0]?.count ?? 0,
    })) as LineupWithRelations[];

  lineups.value.push(...items);
  hasMore.value = items.length === PAGE_SIZE;
  loading.value = false;
}

// Fetch total count
async function fetchCount() {
  if (!folder.value) return;
  const { count } = await supabase
    .from("lineup_bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("folder_id", folder.value.id)
    .eq("user_id", currentUserId.value);
  lineupsCount.value = count || 0;
}

// Rename
async function executeRename() {
  if (!folder.value || !newTitle.value.trim()) return;
  renameLoading.value = true;

  await supabase
    .from("bookmark_folders")
    .update({
      title: newTitle.value.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", folder.value.id);

  await refreshFolder();
  showRenameModal.value = false;
  renameLoading.value = false;
}

// Delete
function confirmDelete() {
  if (!folder.value) return;
  deleteError.value = null;
  showDeleteModal.value = true;
}

async function executeDelete() {
  if (!folder.value) return;
  deleteLoading.value = true;
  deleteError.value = null;

  const { error } = await supabase
    .from("bookmark_folders")
    .delete()
    .eq("id", folder.value.id);

  if (error) {
    deleteError.value = error.message;
    deleteLoading.value = false;
    return;
  }

  await navigateTo("/profile");
}

// Initial fetch
onMounted(() => {
  fetchLineups();
  fetchCount();
});

// Infinite scroll
let observer: IntersectionObserver | null = null;

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value && !loading.value) {
        fetchLineups();
      }
    },
    { rootMargin: "200px" },
  );
  if (sentinel.value) observer.observe(sentinel.value);
});

onUnmounted(() => {
  observer?.disconnect();
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
</script>
