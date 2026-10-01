<!--
  Шапка как у «Битрикс24 Ответы»: логотип-слово + серое слово раздела, поиск,
  кнопка справа. На главной поиск в шапке скрыт, пока виден большой поиск
  первого экрана (searchHidden), — так же ведёт себя оригинал.
-->
<template>
  <header class="hd-header">
    <NuxtLink to="/" class="hd-logo" aria-label="На главную">
      <span class="hd-logo-brand">{{ brand }}</span>
      <span class="hd-logo-word">{{ word }}</span>
    </NuxtLink>

    <div class="hd-header-search" :class="{ 'is-hidden': searchHidden }">
      <HdSearch />
    </div>

    <div class="hd-header-actions">
      <a class="hd-btn-outline" :href="github" target="_blank" rel="noopener">
        <UIcon name="i-lucide-github" />
        <span>GitHub</span>
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps({
  brand: { type: String, default: 'bxshef' },
  word: { type: String, default: 'Навыки' },
  searchHidden: { type: Boolean, default: false },
})
const github = 'https://github.com/bx-shef'
</script>
