<template>
  <div v-if="lineup" class="max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink :to="`/lineups/${lineup.id}`" replace class="text-gray-400 hover:text-white">← Back</NuxtLink>
      <h1 class="text-3xl font-bold text-white">Edit Lineup</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <LineupFormFields
        :form="form"
        :agents="agents"
        :maps="maps"
        :selected-agent-abilities="selectedAgentAbilities"
        :ability-slot-to-key="abilitySlotToKey"
      />

      <!-- Media: existing + new, drag to reorder -->
      <div class="bg-gray-800 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-white mb-4">Media (Images/Videos)</h2>
        <p class="text-gray-400 text-sm mb-4">Drag to reorder. Click the star to set as cover.</p>

        <div class="space-y-4">
          <!-- Ordered media list -->
          <div v-if="mediaList.length">
            <draggable
              v-model="mediaList"
              item-key="dragId"
              handle=".drag-handle"
              tag="div"
              class="space-y-4 media-draggable-list"
              :animation="300"
              ghost-class="media-drag-ghost"
              chosen-class="media-drag-chosen"
              drag-class="media-drag-active"
            >
              <template #default>
                <div
                  v-for="item in mediaList"
                  :key="item.dragId"
                  class="flex items-center gap-4 bg-gray-900 rounded-lg p-4 media-drag-item"
                >
                  <div class="drag-handle cursor-grab active:cursor-grabbing flex items-center text-gray-500 hover:text-gray-300 p-1" title="Drag to reorder">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8V6zm0 5h2v2H8v-2zm0 5h2v2H8v-2zm5-10h2v2h-2V6zm0 5h2v2h-2v-2zm0 5h2v2h-2v-2z"/></svg>
                  </div>

                  <div class="w-32 h-20 bg-gray-700 rounded overflow-hidden flex-shrink-0 relative cursor-pointer" @click="openPreview(item)">
                    <template v-if="item.kind === 'existing'">
                      <img v-if="item.media_type === 'image'" :src="item.url" class="w-full h-full object-cover" />
                      <video v-else :src="item.url" class="w-full h-full object-cover" />
                    </template>
                    <template v-else>
                      <img v-if="item.type === 'image'" :src="item.preview" class="w-full h-full object-cover" />
                      <video v-else :src="item.preview" class="w-full h-full object-cover" />
                    </template>
                    <span v-if="item.is_cover" class="absolute top-0.5 left-0.5 bg-red-500 text-white text-[10px] px-1 rounded">Cover</span>
                  </div>

                  <div class="flex-1">
                    <input
                      v-model="item.description"
                      type="text"
                      class="w-full bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
                      placeholder="Description..."
                    />
                    <p v-if="item.kind === 'new'" class="text-gray-500 text-xs mt-1">{{ item.file.name }}</p>
                  </div>

                  <button
                    type="button"
                    @click="setCover(item.dragId)"
                    class="flex-shrink-0 transition-colors"
                    :class="item.is_cover ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'"
                    title="Set as cover"
                  >
                    <svg class="w-5 h-5" viewBox="0 0 24 24" :fill="item.is_cover ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                  <button type="button" @click="removeMediaByItem(item)" class="text-red-500 hover:text-red-400">
                    Remove
                  </button>
                </div>
              </template>
            </draggable>
          </div>

          <!-- Add more files -->
          <FileDropZone label="Add more files (drop or click)" sublabel="" @files="addFiles" />
        </div>
      </div>

      <div class="flex gap-4">
        <button
          type="submit"
          :disabled="submitting"
          class="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white py-3 rounded-md font-semibold transition-colors"
        >
          {{ submitting ? 'Saving...' : 'Save Changes' }}
        </button>
        <button
          type="button"
          @click="form.is_published = !form.is_published"
          class="px-6 py-3 rounded-md font-semibold transition-colors"
          :class="form.is_published ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'"
        >
          {{ form.is_published ? 'Public' : 'Draft' }}
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
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <template v-if="previewItem.kind === 'existing'">
          <img
            v-if="previewItem.media_type === 'image'"
            :src="previewItem.url"
            class="max-w-[95vw] max-h-[95vh] object-contain"
          />
          <video
            v-else
            :src="previewItem.url"
            controls
            autoplay
            class="max-w-[95vw] max-h-[95vh]"
          />
        </template>
        <template v-else>
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
        </template>
      </div>
    </Teleport>
  </div>
  <div v-else-if="forbidden" class="text-red-400 text-center py-12">You can't edit this lineup.</div>
  <div v-else class="text-gray-400 py-12">Loading...</div>
</template>

<script setup lang="ts">
import { VueDraggableNext as draggable } from 'vue-draggable-next'
import { useDebounceFn } from '@vueuse/core'
import type { LineupWithRelations, LineupMedia } from '~/types/database.types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient<any>()
const user = useSupabaseUser()
const { updateLineup, fileToBase64 } = useLineupApi()
const { markAsUpdated } = useLineupEvents()

const { form, agents, maps, selectedAgentAbilities, abilitySlotToKey, processFiles, revokePreviewUrl } = useLineupForm()

const lineupId = route.params.id as string
const currentUserId = computed(() => (user.value as any)?.id ?? (user.value as any)?.sub)

type ExistingMediaItem = {
  kind: 'existing'
  id: string
  dragId: string
  url: string
  media_type: 'image' | 'video'
  description: string | null
  is_cover: boolean
}
type NewMediaItem = {
  kind: 'new'
  dragId: string
  file: File
  type: 'image' | 'video'
  preview: string
  description: string
  is_cover: boolean
}
type EditMediaItem = ExistingMediaItem | NewMediaItem

const lineup = ref<LineupWithRelations | null>(null)
const forbidden = ref(false)
const mediaList = ref<EditMediaItem[]>([])
const submitting = ref(false)
const error = ref('')
const previewItem = ref<EditMediaItem | null>(null)

function openPreview(item: EditMediaItem) {
  previewItem.value = item
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') previewItem.value = null
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// Load lineup and ensure owner
const { data: lineupData } = await useAsyncData(`lineup-edit-${lineupId}`, async () => {
  const { data } = await supabase
    .from('lineups')
    .select(`*, profile:profiles(*), media:lineup_media(*)`)
    .eq('id', lineupId)
    .single()
  return data as LineupWithRelations | null
})

watch(lineupData, (v) => {
  if (!v) {
    lineup.value = null
    return
  }
  if (currentUserId.value && v.user_id !== currentUserId.value) {
    forbidden.value = true
    lineup.value = null
    return
  }
  lineup.value = v
  form.title = v.title
  form.description = v.description ?? ''
  form.agent_uuid = v.agent_uuid
  form.map_uuid = v.map_uuid
  form.side = (v.side ?? '') as '' | 'attack' | 'defense'
  form.site = v.site ?? ''
  form.ability = v.ability ?? ''
  form.is_published = v.is_published
  const sorted = [...(v.media ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  mediaList.value = sorted.map((m: LineupMedia) => ({
    kind: 'existing' as const,
    id: m.id,
    dragId: m.id,
    url: m.url,
    media_type: m.media_type,
    description: m.description,
    is_cover: m.is_cover
  }))
}, { immediate: true })

async function addFiles(files: File[]) {
  const hasCover = mediaList.value.some(m => m.is_cover)
  const items = await processFiles(files, hasCover)
  for (const item of items) {
    mediaList.value.push({
      kind: 'new',
      dragId: item.id,
      file: item.file,
      type: item.type,
      preview: item.preview,
      description: item.description,
      is_cover: item.is_cover
    })
  }
}

function setCover(dragId: string) {
  for (const item of mediaList.value) {
    item.is_cover = item.dragId === dragId
  }
}

function removeMediaByItem(item: EditMediaItem) {
  const index = mediaList.value.indexOf(item)
  if (index === -1) return
  const wasCover = item.is_cover
  if (item.kind === 'new') {
    revokePreviewUrl(item.preview)
  }
  mediaList.value.splice(index, 1)
  if (wasCover && mediaList.value.length > 0 && mediaList.value[0]) {
    mediaList.value[0].is_cover = true
  }
}

const handleSubmit = useDebounceFn(async () => {
  if (!lineup.value || !currentUserId.value || lineup.value.user_id !== currentUserId.value || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    // Build media payload
    const mediaPayload = await Promise.all(
      mediaList.value.map(async (item, index) => {
        if (item.kind === 'existing') {
          return {
            id: item.id,
            type: item.media_type,
            description: item.description || undefined,
            is_cover: item.is_cover,
            sort_order: index,
          }
        } else {
          return {
            file: await fileToBase64(item.file),
            filename: item.file.name,
            type: item.type,
            description: item.description || undefined,
            is_cover: item.is_cover,
            sort_order: index,
          }
        }
      })
    )

    await updateLineup({
      lineup_id: lineup.value.id,
      title: form.title,
      description: form.description || undefined,
      agent_uuid: form.agent_uuid,
      map_uuid: form.map_uuid,
      side: form.side || undefined,
      site: form.site || undefined,
      ability: form.ability || undefined,
      is_published: form.is_published,
      media: mediaPayload,
    })

    markAsUpdated(lineup.value.id)
    await navigateTo(`/lineups/${lineup.value.id}`, { replace: true })
  } catch (e: any) {
    error.value = e.message || 'Failed to save'
  } finally {
    submitting.value = false
  }
}, 500)

onUnmounted(() => {
  mediaList.value
    .filter((item): item is NewMediaItem => item != null && item.kind === 'new')
    .forEach(item => revokePreviewUrl(item.preview))
})
</script>
