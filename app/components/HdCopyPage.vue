<!--
  «Копировать страницу» с меню: копировать Markdown, посмотреть как Markdown,
  открыть в ChatGPT / Claude. Markdown страницы отдаёт server/routes/raw/[...slug].ts
  по адресу /raw/<путь>.md.
-->
<template>
  <B24FieldGroup class="hd-copy-page">
    <B24Button
      color="air-secondary-no-accent"
      size="sm"
      :icon="icon(copied ? 'check' : 'markdown')"
      :label="copied ? 'Скопировано' : 'Копировать страницу'"
      title="Копировать текст статьи (Markdown)"
      class="hd-copy-page-main"
      @click="copyMarkdown"
    />
    <B24DropdownMenu :items="items" :content="{ align: 'end' }">
      <B24Button color="air-secondary-no-accent" size="sm" :icon="icon('chevron-down')" aria-label="Ещё" />
    </B24DropdownMenu>
  </B24FieldGroup>
</template>

<script setup lang="ts">
const route = useRoute()
const site = useRuntimeConfig().public.siteUrl as string
const copied = ref(false)

const rawPath = computed(() => `/raw${route.path.replace(/\/$/, '')}.md`)
const askUrl = (base: string) => base + encodeURIComponent(`Прочитай ${site}${rawPath.value}, чтобы я мог задать по ней вопросы.`)

const items = computed(() => [
  { label: 'Копировать Markdown', icon: icon('copy'), onSelect: copyMarkdown },
  { label: 'Посмотреть как Markdown', icon: icon('markdown'), to: rawPath.value, target: '_blank' },
  { label: 'Открыть в ChatGPT', icon: icon('link'), to: askUrl('https://chatgpt.com/?hints=search&q='), target: '_blank' },
  { label: 'Открыть в Claude', icon: icon('link'), to: askUrl('https://claude.ai/new?q='), target: '_blank' },
])

async function copyMarkdown() {
  try {
    const text = await $fetch<string>(rawPath.value, { responseType: 'text' })
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* буфер недоступен во фрейме без разрешения */ }
}
</script>

<style scoped>
.hd-copy-page { flex: 0 0 auto; }
/* на узком экране — только иконка: подпись не помещается рядом с крошками */
@container hd-article (max-width: 620px) { .hd-copy-page-main :deep([data-slot="label"]) { display: none; } }
@media (max-width: 767px) { .hd-copy-page-main :deep([data-slot="label"]) { display: none; } }
</style>
