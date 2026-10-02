<!--
  Шапка: логотип-слово + серое слово раздела; справа — ИИ, тема, GitHub.
  Вопрос ИИ-агенту задаётся с первого экрана, из плавающего поля и из меню.
-->
<template>
  <header class="hd-header">
    <NuxtLink to="/" class="hd-logo" aria-label="На главную">
      <span class="hd-logo-brand">{{ brand }}</span>
      <span class="hd-logo-word">{{ word }}</span>
    </NuxtLink>

    <div class="hd-header-actions">
      <button type="button" class="hd-header-icon" :class="{ 'is-on': chatOpen }" title="Спросить ИИ" aria-label="Спросить ИИ" @click="chatOpen ? closeChat() : openChat()">
        <HdIcon name="ai" />
      </button>
      <ClientOnly>
        <button type="button" class="hd-header-icon" :title="isDark ? 'Светлая тема' : 'Тёмная тема'" aria-label="Сменить тему" @click="toggleTheme">
          <HdIcon :name="isDark ? 'sun' : 'moon'" />
        </button>
      </ClientOnly>
      <a class="hd-header-icon" :href="github" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub">
        <HdIcon name="github" />
      </a>
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
