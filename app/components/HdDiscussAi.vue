<!--
  «Обсудить с ИИ» под оглавлением статьи (кнопка Bitrix24 UI, цвет air-boost).
  Открывает чат и сразу просит пересказать эту страницу — дальше можно задавать вопросы.
  Путь страницы уходит на сервер в теле запроса — в контексте только она.
-->
<template>
  <B24Button color="air-boost" block class="hd-discuss" @click="discuss">Обсудить с ИИ</B24Button>
</template>

<script setup lang="ts">
const props = defineProps<{ title?: string }>()
const route = useRoute()
const { discussPage } = useHdChat()

const discuss = () => discussPage(route.path, props.title || document.title)
</script>

<style scoped>
.hd-discuss { margin-top: 32px; }
</style>
