<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-white mb-8">Create Lineup</h1>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Basic Info -->
      <LineupFormFields
        v-model:form="form"
        :agents="agents"
        :maps="maps"
        :selected-agent-abilities="selectedAgentAbilities"
        :ability-slot-to-key="abilitySlotToKey"
      />

      <!-- Media Upload -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-4">
          Media (Images/Videos)
        </h2>

        <div class="space-y-4">
          <!-- Media Preview List (drag to reorder) -->
          <div v-if="mediaItems.length" class="space-y-4">
            <p class="text-gray-400 text-sm">
              Drag to reorder. Click the star to set as cover.
            </p>
            <draggable
              v-model="mediaItems"
              item-key="id"
              handle=".drag-handle"
              tag="div"
              class="space-y-4 media-draggable-list"
              :animation="200"
              ghost-class="media-drag-ghost"
              chosen-class="media-drag-chosen"
            >
              <div
                v-for="item in mediaItems"
                :key="item.id"
                class="flex items-center gap-4 bg-gray-900 rounded-lg p-4 media-drag-item"
              >
                <div
                  class="drag-handle cursor-grab active:cursor-grabbing flex items-center text-gray-500 hover:text-gray-300 p-1"
                  title="Drag to reorder"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z"
                    />
                  </svg>
                </div>
                <div
                  class="w-32 h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0 relative cursor-pointer"
                  @click="openPreview(item)"
                >
                  <img
                    v-if="item.type === 'image'"
                    :src="item.preview"
                    class="w-full h-full object-cover"
                  />
                  <video
                    v-else
                    :src="item.preview"
                    class="w-full h-full object-cover"
                  />
                  <span
                    v-if="item.is_cover"
                    class="absolute top-0.5 left-0.5 bg-red-500 text-white text-[10px] px-1 rounded"
                    >Cover</span
                  >
                </div>

                <div class="flex-1">
                  <input
                    v-model="item.description"
                    type="text"
                    class="w-full bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
                    placeholder="Description for this image/video..."
                  />
                  <p class="text-gray-500 text-xs mt-1">{{ item.file.name }}</p>
                </div>

                <button
                  type="button"
                  class="flex-shrink-0 transition-colors"
                  :class="
                    item.is_cover
                      ? 'text-yellow-400'
                      : 'text-gray-600 hover:text-yellow-400'
                  "
                  title="Set as cover"
                  @click="setCover(item.id)"
                >
                  <svg
                    class="w-5 h-5"
                    viewBox="0 0 24 24"
                    :fill="item.is_cover ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polygon
                      points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-400"
                  @click="removeMediaById(item.id)"
                >
                  Remove
                </button>
              </div>
            </draggable>
          </div>

          <!-- Upload Area -->
          <FileDropZone @files="addFiles" />
        </div>
      </div>

      <!-- Submit -->
      <div class="flex gap-4">
        <button
          type="submit"
          :disabled="submitting"
          class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white py-3 rounded-md font-semibold transition-colors"
        >
          {{ submitting ? "Creating..." : "Create Lineup" }}
        </button>

        <button
          type="button"
          class="px-6 py-3 rounded-md font-semibold transition-colors"
          :class="
            form.is_published
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300'
          "
          @click="form.is_published = !form.is_published"
        >
          {{ form.is_published ? "Public" : "Draft" }}
        </button>
      </div>

      <div v-if="error" class="text-red-500">{{ error }}</div>
    </form>

    <Teleport to="body">
      <div
        v-if="previewItem"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        @click.self="previewItem = null"
      >
        <button
          class="absolute top-4 right-4 text-white/70 hover:text-white z-10"
          @click="previewItem = null"
        >
          <svg
            class="w-8 h-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <img
          v-if="previewItem.type === 'image'"
          :src="previewItem.preview"
          class="max-w-[95vw] max-h-[95vh] object-contain"
        />
        <video
          v-else
          :src="previewItem.preview"
          controls
          autoplay
          class="max-w-[95vw] max-h-[95vh]"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { VueDraggableNext as draggable } from "vue-draggable-next";
import { useDebounceFn } from "@vueuse/core";
import type { NewMediaItem } from "~/composables/useLineupForm";

definePageMeta({
  middleware: "auth",
});

const user = useSupabaseUser();
const { createLineup, fileToBase64 } = useLineupApi();
const { markAsCreated } = useLineupEvents();

const {
  form,
  agents,
  maps,
  selectedAgentAbilities,
  abilitySlotToKey,
  processFiles,
  revokePreviewUrl,
} = useLineupForm();

const mediaItems = ref<NewMediaItem[]>([]);
const submitting = ref(false);
const error = ref("");
const previewItem = ref<NewMediaItem | null>(null);

function openPreview(item: NewMediaItem) {
  previewItem.value = item;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") previewItem.value = null;
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

const addFiles = async (files: File[]) => {
  const hasCover = mediaItems.value.some((m) => m.is_cover);
  const items = await processFiles(files, hasCover);
  mediaItems.value.push(...items);
};

function setCover(id: string) {
  for (const item of mediaItems.value) {
    item.is_cover = item.id === id;
  }
}

function removeMediaById(id: string) {
  const index = mediaItems.value.findIndex((m) => m.id === id);
  if (index === -1) return;
  const item = mediaItems.value[index]!;
  const wasCover = item.is_cover;
  revokePreviewUrl(item.preview);
  mediaItems.value.splice(index, 1);
  if (wasCover && mediaItems.value.length > 0 && mediaItems.value[0]) {
    mediaItems.value[0].is_cover = true;
  }
}

const handleSubmit = useDebounceFn(async () => {
  if (!user.value || submitting.value) return;

  submitting.value = true;
  error.value = "";

  try {
    // Convert files to base64
    const mediaPayload = await Promise.all(
      mediaItems.value.map(async (item) => ({
        file: await fileToBase64(item.file),
        filename: item.file.name,
        type: item.type,
        description: item.description || undefined,
        is_cover: item.is_cover,
      })),
    );

    const result = await createLineup({
      title: form.title,
      description: form.description || undefined,
      agent_uuid: form.agent_uuid,
      map_uuid: form.map_uuid,
      side: form.side || undefined,
      site: form.site || undefined,
      ability: form.ability || undefined,
      is_published: form.is_published,
      media: mediaPayload,
    });

    markAsCreated();
    navigateTo(`/lineups/${result.lineup_id}`);
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : "Failed to create lineup";
    submitting.value = false;
  }
}, 500);

onUnmounted(() => {
  mediaItems.value.forEach((item) => revokePreviewUrl(item.preview));
});
</script>
