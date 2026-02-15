<template>
  <div
    class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-red-500 transition-colors cursor-pointer"
    @drop.prevent="onDrop"
    @dragover.prevent
    @click="fileInput?.click()"
  >
    <input
      ref="fileInput"
      type="file"
      multiple
      :accept="accept"
      class="hidden"
      @change="onFileSelect"
    />
    <div class="text-gray-400 hover:text-white">
      <p class="text-lg mb-2">{{ label }}</p>
      <p v-if="sublabel" class="text-sm">{{ sublabel }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    sublabel?: string;
    accept?: string;
  }>(),
  {
    label: "Drop files here or click to upload",
    sublabel: "Supports images and videos",
    accept: "image/*,video/*",
  },
);

const emit = defineEmits<{
  files: [files: File[]];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

const onFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files?.length) {
    emit("files", Array.from(target.files));
    target.value = "";
  }
};

const onDrop = (event: DragEvent) => {
  if (event.dataTransfer?.files?.length) {
    emit("files", Array.from(event.dataTransfer.files));
  }
};
</script>
