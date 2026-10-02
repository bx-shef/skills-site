<!--
  Шапка: логотип-слово + серое слово раздела; справа — ИИ, тема, GitHub.
  Вопрос ИИ-агенту задаётся с первого экрана, из плавающего поля и из меню.
-->
<template>
  <header class="hd-header">
    <!-- меню на узком экране (уже 1024px) — панелью; на широком колонка меню видна всегда -->
    <B24DashboardSidebarToggle color="air-tertiary" aria-label="Меню" />
    <NuxtLink to="/" class="hd-logo" aria-label="На главную">
      <span class="hd-logo-brand">{{ brand }}</span>
      <span class="hd-logo-word">{{ word }}</span>
    </NuxtLink>

    <div class="hd-header-actions">
      <B24Button color="air-tertiary" :active="chatOpen" active-color="air-secondary-accent" :icon="icon('ai')" title="Спросить ИИ" aria-label="Спросить ИИ" @click="chatOpen ? closeChat() : openChat()" />
      <ClientOnly>
        <B24Button color="air-tertiary" :icon="icon(isDark ? 'sun' : 'moon')" :title="isDark ? 'Светлая тема' : 'Тёмная тема'" aria-label="Сменить тему" @click="toggleTheme" />
      </ClientOnly>
      <B24Button color="air-tertiary" :icon="icon('github')" :to="github" target="_blank" title="GitHub" aria-label="GitHub" />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps({
  brand: { type: String, default: 'bxshef' },
  word: { type: String, default: 'Навыки' },
})
const github = 'https://github.com/bx-shef'
const { open: chatOpen, openChat, closeChat } = useHdChat()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toggleTheme = () => { colorMode.preference = isDark.value ? 'light' : 'dark' }
</script>
