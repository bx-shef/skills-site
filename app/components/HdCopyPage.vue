<!--
  «Копировать страницу» с меню, как в Docus / документации Bitrix24 UI:
  копировать Markdown, посмотреть как Markdown, открыть в ChatGPT / Claude.
  Markdown страницы отдаёт server/routes/raw/[...slug].ts по адресу /raw/<путь>.md.
-->
<template>
  <div ref="root" class="hd-copy-page">
    <button type="button" class="hd-copy-page-main" title="Копировать текст статьи (Markdown)" @click="copyMarkdown">
      <HdIcon :name="copied ? 'check' : 'markdown'" />
      <span>{{ copied ? 'Скопировано' : 'Копировать страницу' }}</span>
    </button>
    <button type="button" class="hd-copy-page-toggle" aria-label="Ещё" :aria-expanded="open" @click="open = !open">
      <HdIcon name="chevron-down" />
    </button>

    <div v-if="open" class="hd-copy-page-menu" role="menu">
      <button type="button" role="menuitem" @click="copyMarkdown(); open = false">
        <HdIcon name="copy" /> Копировать Markdown
      </button>
      <a :href="rawPath" target="_blank" role="menuitem" @click="open = false">
        <HdIcon name="markdown" /> Посмотреть как Markdown <span class="hd-ext">↗</span>
      </a>
      <a :href="askUrl('https://chatgpt.com/?hints=search&q=')" target="_blank" rel="noopener" role="menuitem" @click="open = false">
        <svg viewBox="0 0 24 24" class="hd-copy-page-logo" aria-hidden="true"><path fill="currentColor" d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.08ZM13.26 22.43a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5ZM3.6 18.3a4.47 4.47 0 0 1-.54-3.01l.14.08 4.78 2.77a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06l-4.84 2.79A4.5 4.5 0 0 1 3.6 18.3ZM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97V11.6a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.87Zm16.6 3.86-5.83-3.39 2.01-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1V12.4a.79.79 0 0 0-.4-.67Zm2.01-3.02-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.24V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66ZM8.31 12.86 6.3 11.7a.08.08 0 0 1-.04-.06V6.08a4.5 4.5 0 0 1 7.37-3.45l-.14.08-4.78 2.76a.8.8 0 0 0-.39.68Zm1.1-2.37 2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5Z" /></svg>
        Открыть в ChatGPT <span class="hd-ext">↗</span>
      </a>
      <a :href="askUrl('https://claude.ai/new?q=')" target="_blank" rel="noopener" role="menuitem" @click="open = false">
        <svg viewBox="0 0 24 24" class="hd-copy-page-logo" aria-hidden="true"><path fill="currentColor" d="M17.3 3.54h-3.67l6.7 16.92H24Zm-10.6 0L0 20.46h3.74l1.37-3.55h7.01l1.37 3.55h3.74L10.54 3.54Zm-.37 10.23 2.29-5.94 2.29 5.94Z" /></svg>
        Открыть в Claude <span class="hd-ext">↗</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const site = useRuntimeConfig().public.siteUrl as string
const open = ref(false)
const copied = ref(false)
const root = ref<HTMLElement>()

const rawPath = computed(() => `/raw${route.path.replace(/\/$/, '')}.md`)
const askUrl = (base: string) => base + encodeURIComponent(`Прочитай ${site}${rawPath.value}, чтобы я мог задать по ней вопросы.`)

async function copyMarkdown() {
  try {
    const text = await $fetch<string>(rawPath.value, { responseType: 'text' })
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* буфер недоступен во фрейме без разрешения */ }
}

const onDoc = (e: MouseEvent) => { if (root.value && !root.value.contains(e.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', onDoc))
onBeforeUnmount(() => document.removeEventListener('click', onDoc))
</script>

<style scoped>
.hd-copy-page { position: relative; display: inline-flex; flex: 0 0 auto; }
.hd-copy-page-main, .hd-copy-page-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  border: 1px solid var(--hd-border-button);
  background: var(--hd-bg);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--hd-text-secondary);
  cursor: pointer;
  transition: var(--hd-transition);
}
.hd-copy-page-main { padding: 0 10px; border-radius: 8px 0 0 8px; }
.hd-copy-page-toggle { padding: 0 6px; border-left: 0; border-radius: 0 8px 8px 0; }
.hd-copy-page-main:hover, .hd-copy-page-toggle:hover { background: var(--hd-hover-bg); color: var(--hd-text-heading); }
.hd-copy-page :deep(.hd-icon) { font-size: 16px; }
.hd-copy-page-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 120;
  display: flex;
  flex-direction: column;
  min-width: 270px;
  white-space: nowrap;
  padding: 6px;
  border-radius: 12px;
  background: var(--hd-bg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, .12);
}
.hd-copy-page-menu > * {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--hd-text-primary);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.hd-copy-page-menu > *:hover { background: var(--hd-hover-bg); color: var(--hd-text-heading); text-decoration: none; }
.hd-copy-page-logo { width: 16px; height: 16px; flex: 0 0 auto; }
.hd-ext { margin-left: auto; color: var(--hd-text-tertiary); font-size: 12px; }
</style>
<style scoped>
/* мало места (узкий экран или открыт чат) — только иконка; ширина — колонки статьи */
@container hd-article (max-width: 620px) { .hd-copy-page-main span { display: none; } }
</style>
