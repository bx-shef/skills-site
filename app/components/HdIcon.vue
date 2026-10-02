<!--
  Иконка из набора Битрикс24 (@bitrix24/b24icons-vue) по короткому имени — таблица в app/utils/icons.ts.
-->
<template>
  <component :is="icon(name)" v-if="icon(name)" class="hd-icon" aria-hidden="true" />
</template>

<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<style>
/* :where — нулевая специфичность: размер иконки задаёт место, где она стоит */
:where(.hd-icon) { display: inline-block; flex: 0 0 auto; width: 1.25em; height: 1.25em; fill: currentColor; }
</style>
