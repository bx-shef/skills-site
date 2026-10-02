<!--
  «Копировать» над статьёй — одна группа: ссылка на статью | текст статьи (Markdown) | меню
  (посмотреть как Markdown, открыть в ChatGPT / Claude). Markdown страницы отдаёт
  server/routes/raw/[...slug].ts по адресу /raw/<путь>.md; у страниц без него — только ссылка.
-->
<template>
  <span class="hd-copy-page">
    <span class="hd-copy-page-label">Копировать</span>
    <B24FieldGroup>
      <B24Button
        color="air-secondary-no-accent"
        size="sm"
        :icon="icon(copied === 'link' ? 'check' : 'link')"
        :label="copied === 'link' ? 'Скопировано' : 'Ссылку'"
        title="Скопировать ссылку на статью"
        class="hd-copy-page-btn"
        @click="copyLink"
      />
      <B24Button
        v-if="markdown"
        color="air-secondary-no-accent"
        size="sm"
        :icon="icon(copied === 'text' ? 'check' : 'markdown')"
        :label="copied === 'text' ? 'Скопировано' : 'Текст'"
        title="Скопировать текст статьи (Markdown) — например, чтобы отдать ИИ-агенту"
        class="hd-copy-page-btn"
        @click="copyMarkdown"
      />
      <!-- не modal: открытое меню не блокирует прокрутку страницы и она не прыгает -->
      <B24DropdownMenu v-if="markdown" :items="items" :modal="false" :content="{ align: 'end' }">
        <B24Button color="air-secondary-no-accent" size="sm" :icon="icon('chevron-down')" aria-label="Ещё" title="Markdown, ChatGPT, Claude" />
      </B24DropdownMenu>
    </B24FieldGroup>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ markdown?: boolean }>(), { markdown: true })
const route = useRoute()
const site = useRuntimeConfig().public.siteUrl as string
const copied = ref<'' | 'link' | 'text'>('')

const rawPath = computed(() => `/raw${route.path.replace(/\/$/, '')}.md`)
const askUrl = (base: string) => base + encodeURIComponent(`Прочитай ${site}${rawPath.value}, чтобы я мог задать по ней вопросы.`)

const items = computed(() => [
  { label: 'Посмотреть как Markdown', icon: icon('markdown'), to: rawPath.value, target: '_blank' },
  { label: 'Открыть в ChatGPT', icon: icon('link'), to: askUrl('https://chatgpt.com/?hints=search&q='), target: '_blank' },
  { label: 'Открыть в Claude', icon: icon('link'), to: askUrl('https://claude.ai/new?q='), target: '_blank' },
])

async function put(what: 'link' | 'text', text: () => Promise<string> | string) {
  try {
    await navigator.clipboard.writeText(await text())
    copied.value = what
    setTimeout(() => { copied.value = '' }, 1500)
  } catch { /* буфер недоступен во фрейме без разрешения */ }
}
const copyLink = () => put('link', () => location.href.split('#')[0]!)
const copyMarkdown = () => put('text', () => $fetch<string>(rawPath.value, { responseType: 'text' }))
</script>

<style scoped>
.hd-copy-page { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 8px; }
.hd-copy-page-label { font-size: var(--hd-size-sm); color: var(--hd-text-secondary); }
/* на узком экране — только иконки: подписи не помещаются рядом с крошками */
@container hd-article (max-width: 620px) { .hd-copy-page-btn :deep([data-slot="label"]), .hd-copy-page-label { display: none; } }
@media (max-width: 767px) { .hd-copy-page-btn :deep([data-slot="label"]), .hd-copy-page-label { display: none; } }
</style>
