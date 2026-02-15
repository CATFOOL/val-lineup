<template>
  <div v-if="collection" class="max-w-2xl mx-auto">
    <div class="flex items-center gap-4 mb-8">
      <NuxtLink :to="`/collections/${collection.id}`" replace class="text-gray-400 hover:text-white"
        >← Back</NuxtLink
      >
      <h1 class="text-3xl font-bold text-white">Edit Collection</h1>
    </div>

    <form class="space-y-6" @submit.prevent="handleSubmit">
      <div class="bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label class="block text-gray-300 mb-2">Title *</label>
          <input
            v-model="form.title"
            type="text"
            required
            class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
            placeholder="Collection name..."
          >
        </div>

        <div>
          <label class="block text-gray-300 mb-2">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full bg-gray-900 text-white px-4 py-3 rounded-md border border-gray-700 focus:border-red-500 focus:outline-none"
            placeholder="Describe this collection..."
          />
        </div>

        <!-- Cover Image -->
        <div>
          <label class="block text-gray-300 mb-2">Cover Image</label>
          <div class="flex items-start gap-4">
            <!-- Preview -->
            <div class="w-40 aspect-video bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
              <img v-if="coverPreview" :src="coverPreview" class="w-full h-full object-cover" >
              <div v-else class="w-full h-full flex items-center justify-center text-gray-500">
                <svg
                  class="w-10 h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            </div>
            <!-- Upload/Remove buttons -->
            <div class="flex flex-col gap-2">
              <label
                class="cursor-pointer bg-gray-700 hover:bg-gray-600 text-gray-200 px-4 py-2 rounded-md text-sm transition-colors inline-block text-center"
              >
                {{ coverPreview ? 'Change' : 'Upload' }}
                <input type="file" accept="image/*" class="hidden" @change="handleCoverSelect" >
              </label>
              <button
                v-if="coverPreview"
                type="button"
                class="text-red-400 hover:text-red-300 text-sm"
                @click="removeCover"
              >
                Remove
              </button>
            </div>
          </div>
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
          class="px-6 py-3 rounded-md font-semibold transition-colors"
          :class="form.is_published ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'"
          @click="form.is_published = !form.is_published"
        >
          {{ form.is_published ? 'Public' : 'Draft' }}
        </button>
      </div>

      <div v-if="error" class="text-red-500">{{ error }}</div>
    </form>
  </div>
  <div v-else-if="forbidden" class="text-red-400 text-center py-12">
    You can't edit this collection.
  </div>
  <div v-else class="text-gray-400 py-12">Loading...</div>
</template>

<script setup lang="ts">
import { compressImage } from '~/utils/compressImage'
import type { Collection } from '~/types/database.types'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const collectionId = route.params.id as string
const currentUserId = computed(() => user.value?.id)

const collection = ref<Collection | null>(null)
const forbidden = ref(false)
const submitting = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  is_published: true,
})

// Cover image state
const existingCoverUrl = ref<string | null>(null)
const newCoverFile = ref<File | null>(null)
const newCoverPreview = ref<string | null>(null)
const coverRemoved = ref(false)

const coverPreview = computed(() => {
  if (coverRemoved.value) return null
  if (newCoverPreview.value) return newCoverPreview.value
  return existingCoverUrl.value
})

const { data: collectionData } = await useAsyncData(`collection-edit-${collectionId}`, async () => {
  const { data } = await supabase.from('collections').select('*').eq('id', collectionId).single()
  return data
})

watch(
  collectionData,
  v => {
    if (!v) {
      collection.value = null
      return
    }
    if (currentUserId.value && v.user_id !== currentUserId.value) {
      forbidden.value = true
      collection.value = null
      return
    }
    collection.value = v
    form.title = v.title
    form.description = v.description ?? ''
    form.is_published = v.is_published
    existingCoverUrl.value = v.cover_url ?? null
  },
  { immediate: true }
)

async function handleCoverSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Clean up old preview
  if (newCoverPreview.value) {
    URL.revokeObjectURL(newCoverPreview.value)
  }

  // 压缩图片
  const compressedFile = await compressImage(file)
  newCoverFile.value = compressedFile
  newCoverPreview.value = URL.createObjectURL(compressedFile)
  coverRemoved.value = false
}

function removeCover() {
  if (newCoverPreview.value) {
    URL.revokeObjectURL(newCoverPreview.value)
  }
  newCoverFile.value = null
  newCoverPreview.value = null
  coverRemoved.value = true
}

async function handleSubmit() {
  if (!collection.value || !currentUserId.value || collection.value.user_id !== currentUserId.value)
    return
  submitting.value = true
  error.value = ''

  try {
    let coverUrl = existingCoverUrl.value

    // Handle cover upload/removal
    if (coverRemoved.value) {
      coverUrl = null
    } else if (newCoverFile.value) {
      const ext = newCoverFile.value.name.split('.').pop()
      const fileName = `${currentUserId.value}/${collection.value.id}/cover-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('collection-covers')
        .upload(fileName, newCoverFile.value)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('collection-covers').getPublicUrl(fileName)

      coverUrl = urlData.publicUrl
    }

    const { error: updateError } = await supabase
      .from('collections')
      .update({
        title: form.title,
        description: form.description || null,
        cover_url: coverUrl,
        is_published: form.is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collection.value.id)

    if (updateError) throw updateError

    await navigateTo(`/collections/${collection.value.id}`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to save'
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  if (newCoverPreview.value) {
    URL.revokeObjectURL(newCoverPreview.value)
  }
})
</script>
