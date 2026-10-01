<!--
  «Обсудить с ИИ» под оглавлением статьи (кнопка Bitrix24 UI, цвет air-boost).
  Открывает чат и сразу просит пересказать эту страницу — дальше можно задавать вопросы.
  Сервер видит адрес страницы в вопросе и кладёт её в контекст первой.
-->
<template>
  <B24Button color="air-boost" block class="hd-discuss" @click="discuss">Обсудить с ИИ</B24Button>
</template>

<script setup lang="ts">
const route = useRoute()
const site = useRuntimeConfig().public.siteUrl as string
const { openChat } = useHdChat()

function discuss() {
  openChat(`Прочитай эту страницу документации и кратко перескажи её — я хочу задать по ней вопросы: ${site}${route.path}`)
}
</script>

<style scoped>
.hd-discuss { margin-top: 32px; }
</style>
