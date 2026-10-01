<!--
  Шапка: логотип-слово + серое слово раздела, кнопка справа.
  Вопрос ИИ-агенту задаётся с первого экрана, из плавающего поля и из меню.
-->
<template>
  <header class="hd-header">
    <NuxtLink to="/" class="hd-logo" aria-label="На главную">
      <span class="hd-logo-brand">{{ brand }}</span>
      <span class="hd-logo-word">{{ word }}</span>
    </NuxtLink>

    <div class="hd-header-actions">
      <a class="hd-btn-outline" :href="github" target="_blank" rel="noopener">
        <HdIcon name="github" />
        <span>GitHub</span>
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
</script>
