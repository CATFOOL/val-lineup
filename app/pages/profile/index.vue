<template>
  <div class="text-gray-400">Redirecting...</div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });

const user = useSupabaseUser();
const supabase = useSupabaseClient();

onMounted(async () => {
  const uid = user.value?.id;
  if (!uid) {
    await navigateTo("/login");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", uid)
    .single();

  if (profile?.username) {
    await navigateTo(`/profile/${profile.username}`, { replace: true });
  }
});
</script>
