<!-- Ссылка в тексте статьи и в ответах чата: внешние (GitHub и др.) — в новой вкладке -->
<template>
  <NuxtLink :href="href" :target="external ? '_blank' : target" :rel="external ? 'noopener' : undefined">
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
const props = defineProps<{ href?: string, target?: string }>()
const external = computed(() => /^https?:\/\//.test(props.href || '') && !(props.href || '').startsWith(useRuntimeConfig().public.siteUrl as string))
</script>
