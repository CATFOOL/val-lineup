<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/60" @click="emit('close')" />
      <div
        class="relative bg-gray-800 rounded-lg w-full max-w-md mx-4 shadow-xl"
      >
        <!-- Header -->
        <div class="p-6 border-b border-gray-700">
          <h3 class="text-lg font-semibold text-white">Save to Bookmark</h3>
        </div>

        <!-- Content -->
        <div class="p-6 max-h-80 overflow-y-auto space-y-3">
          <!-- Create New Folder -->
          <div v-if="showCreateForm" class="space-y-3">
            <input
              v-model="newTitle"
              type="text"
              placeholder="Folder name..."
              class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
              @keyup.enter="createAndAdd"
            />
            <div class="flex gap-2">
              <button
                :disabled="!newTitle.trim() || creating"
                class="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm transition-colors"
                @click="createAndAdd"
              >
                {{ creating ? "Creating..." : "Create" }}
              </button>
              <button
                class="bg-gray-700 text-gray-300 px-4 py-2 rounded-md text-sm hover:bg-gray-600 transition-colors"
                @click="showCreateForm = false"
              >
                Cancel
              </button>
            </div>
          </div>
          <button
            v-else
            class="w-full text-left px-4 py-3 rounded-md bg-gray-900 text-gray-300 hover:bg-gray-700 border border-dashed border-gray-600 text-sm transition-colors"
            @click="showCreateForm = true"
          >
            + New Folder
          </button>

          <!-- Loading -->
          <div v-if="loading" class="text-gray-400 text-center py-4 text-sm">
            Loading folders...
          </div>

          <!-- Folders List -->
          <template v-else>
            <div
              v-for="folder in userFolders"
              :key="folder.id"
              class="flex items-center gap-3 px-4 py-3 rounded-md bg-gray-900 hover:bg-gray-700 cursor-pointer transition-colors"
              :class="{ 'opacity-50 pointer-events-none': folder.toggling }"
              @click="toggleBookmark(folder)"
            >
              <div
                class="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                :class="
                  folder.hasLineup
                    ? 'bg-red-500 border-red-500'
                    : 'border-gray-500'
                "
              >
                <svg
                  v-if="folder.hasLineup"
                  class="w-3 h-3 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white text-sm truncate flex items-center gap-2">
                  {{ folder.title }}
                  <span v-if="folder.is_default" class="text-xs text-red-500"
                    >(Default)</span
                  >
                </p>
                <p class="text-gray-500 text-xs">
                  {{ folder.lineups_count }}
                  {{ folder.lineups_count === 1 ? "lineup" : "lineups" }}
                </p>
              </div>
            </div>

            <div
              v-if="!userFolders.length && !showCreateForm"
              class="text-gray-400 text-center py-4 text-sm"
            >
              No folders yet. Create one above!
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-gray-700">
          <button
            class="w-full bg-gray-700 text-gray-200 py-2.5 rounded-md hover:bg-gray-600 text-sm transition-colors"
            @click="emit('close')"
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
  lineupId: string;
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const supabase = useSupabaseClient();
const user = useSupabaseUser();
const currentUserId = computed(() => user.value?.id);

const loading = ref(false);
const creating = ref(false);
const showCreateForm = ref(false);
const newTitle = ref("");

interface FolderItem {
  id: string;
  title: string;
  is_default: boolean;
  lineups_count: number;
  hasLineup: boolean;
  toggling: boolean;
}

const userFolders = ref<FolderItem[]>([]);

async function fetchFolders() {
  if (!currentUserId.value) return;
  loading.value = true;

  // Fetch user's bookmark folders
  const { data: folders } = await supabase
    .from("bookmark_folders")
    .select("id, title, is_default, lineups_count:lineup_bookmarks(count)")
    .eq("user_id", currentUserId.value)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  // Check which folders already contain this lineup
  const { data: existing } = await supabase
    .from("lineup_bookmarks")
    .select("folder_id")
    .eq("lineup_id", props.lineupId)
    .eq("user_id", currentUserId.value);

  const existingFolderIds = new Set(
    (existing ?? [])
      .map((e: { folder_id: string | null }) => e.folder_id)
      .filter(Boolean),
  );

  userFolders.value = (folders ?? []).map(
    (folder: {
      id: string;
      title: string;
      is_default: boolean;
      lineups_count: { count: number }[];
    }) => ({
      id: folder.id,
      title: folder.title,
      is_default: folder.is_default,
      lineups_count: folder.lineups_count?.[0]?.count ?? 0,
      hasLineup: existingFolderIds.has(folder.id),
      toggling: false,
    }),
  );

  // If user has no folders, auto-create default folder
  if (userFolders.value.length === 0) {
    await createDefaultFolder();
  }

  loading.value = false;
}

async function createDefaultFolder() {
  if (!currentUserId.value) return;

  const { data: newFolder } = await supabase
    .from("bookmark_folders")
    .insert({
      user_id: currentUserId.value,
      title: "Default",
      is_default: true,
    })
    .select("id, title, is_default")
    .single();

  if (newFolder) {
    userFolders.value.unshift({
      id: newFolder.id,
      title: newFolder.title,
      is_default: newFolder.is_default,
      lineups_count: 0,
      hasLineup: false,
      toggling: false,
    });
  }
}

async function toggleBookmark(folder: FolderItem) {
  folder.toggling = true;

  if (folder.hasLineup) {
    // Remove bookmark
    await supabase
      .from("lineup_bookmarks")
      .delete()
      .eq("folder_id", folder.id)
      .eq("lineup_id", props.lineupId)
      .eq("user_id", currentUserId.value);
    folder.hasLineup = false;
    folder.lineups_count--;
  } else {
    // Add bookmark
    await supabase.from("lineup_bookmarks").insert({
      folder_id: folder.id,
      lineup_id: props.lineupId,
      user_id: currentUserId.value,
    });
    folder.hasLineup = true;
    folder.lineups_count++;
  }

  folder.toggling = false;
  emit("updated");
}

async function createAndAdd() {
  if (!newTitle.value.trim() || !currentUserId.value) return;
  creating.value = true;

  const { data: newFolder } = await supabase
    .from("bookmark_folders")
    .insert({
      user_id: currentUserId.value,
      title: newTitle.value.trim(),
      is_default: false,
    })
    .select("id, title, is_default")
    .single();

  if (newFolder) {
    // Auto-add current lineup after creating folder
    await supabase.from("lineup_bookmarks").insert({
      folder_id: newFolder.id,
      lineup_id: props.lineupId,
      user_id: currentUserId.value,
    });

    userFolders.value.push({
      id: newFolder.id,
      title: newFolder.title,
      is_default: newFolder.is_default,
      lineups_count: 1,
      hasLineup: true,
      toggling: false,
    });

    emit("updated");
  }

  newTitle.value = "";
  showCreateForm.value = false;
  creating.value = false;
}

watch(
  () => props.show,
  (val) => {
    if (val) {
      fetchFolders();
    } else {
      showCreateForm.value = false;
      newTitle.value = "";
    }
  },
);
</script>
