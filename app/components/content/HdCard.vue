<!-- Карточка для markdown: :::hd-card{title="…" to="/…" icon="i-lucide-ruler"} текст ::: -->
<template>
  <component :is="to ? NuxtLink : 'div'" :to="to" class="hd-card hd-card-link" :class="{ 'hd-card--blue': blue }">
    <UIcon v-if="icon" :name="icon" class="hd-card-icon" />
    <p class="hd-card-title">{{ title }}</p>
    <div class="hd-card-text"><slot /></div>
  </component>
</template>
<script setup lang="ts">
import { NuxtLink } from '#components'
defineProps({
  title: { type: String, required: true },
  to: { type: String, default: '' },
  icon: { type: String, default: '' },
  blue: { type: Boolean, default: false },
})
</script>
<style scoped>
.hd-card-link { display: block; color: inherit; text-decoration: none; }
.hd-card-link:hover { text-decoration: none; }
.hd-card-icon { width: 26px; height: 26px; display: block; margin-bottom: var(--hd-space-md); color: var(--hd-primary); }
.hd-card-text :deep(p) { margin: 0; }
.hd-card-text :deep(p + p) { margin-top: var(--hd-space-sm); }
</style>
