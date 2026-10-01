<!-- Хлебные крошки над статьёй -->
<template>
  <nav class="hd-breadcrumbs" aria-label="Путь к странице">
    <NuxtLink to="/">Главная</NuxtLink>
    <template v-for="(item, i) in items" :key="item.path || i">
      <span class="hd-breadcrumbs-sep" aria-hidden="true">/</span>
      <!-- последняя крошка — текущая страница, ссылкой не делаем -->
      <span v-if="i === items.length - 1" aria-current="page">{{ item.title }}</span>
      <NuxtLink v-else :to="item.path">{{ item.title }}</NuxtLink>
    </template>
  </nav>
</template>

<script setup>
defineProps({ items: { type: Array, default: () => [] } })
</script>
