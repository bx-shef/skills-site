<!-- Переключатель темы: светлая ↔ тёмная (Nuxt color-mode, атрибут data-theme) -->
<template>
  <ClientOnly>
    <button class="hd-theme" type="button" :title="isDark ? 'Светлая тема' : 'Тёмная тема'" @click="toggle">
      <UIcon :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="hd-theme-svg" />
    </button>
  </ClientOnly>
</template>
<script setup lang="ts">
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toggle = () => { colorMode.preference = isDark.value ? 'light' : 'dark' }
</script>
<style scoped>
.hd-theme { display: inline-flex; padding: 4px; border: 0; background: transparent; color: var(--hd-text-secondary); cursor: pointer; border-radius: var(--hd-radius-sm); }
.hd-theme:hover { color: var(--hd-primary); background: var(--hd-hover-bg); }
.hd-theme-svg { width: 20px; height: 20px; }
</style>
