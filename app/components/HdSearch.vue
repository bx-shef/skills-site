<!--
  Поиск с историей запросов. Ищет по заголовкам и тексту разделов всех страниц
  (queryCollectionSearchSections). Кнопка «→» и Enter без выбранного результата
  отправляют вопрос ИИ-агенту — открывается чат-оверлей с этим вопросом.
-->
<template>
  <div class="hd-search-wrap" @keydown.escape="close">
    <div class="hd-search">
      <input
        v-model="query"
        class="hd-search-input"
        type="search"
        placeholder="Найти на сайте или спросить ИИ-агента"
        aria-label="Поиск по сайту"
        autocomplete="off"
        @focus="historyOpen = true"
        @keydown.enter.prevent="submit"
      >

      <button
        class="hd-search-btn"
        type="button"
        aria-label="Спросить ИИ-агента"
        title="Спросить ИИ-агента"
        :disabled="query.trim().length < 2"
        @click="submit"
      >→</button>
    </div>

    <!-- История показывается, пока не начали печатать -->
    <div v-if="historyOpen && !query && history.length" class="hd-search-history">
      <button
        v-for="item in history"
        :key="item"
        class="hd-search-history-btn"
        type="button"
        @click="pick(item)"
      >
        <span aria-hidden="true">↻</span>
        <span>{{ item }}</span>
      </button>
    </div>

    <div v-else-if="query.trim().length >= 2" class="hd-search-history">
      <NuxtLink
        v-for="item in results"
        :key="item.id"
        :to="item.id"
        class="hd-search-history-btn hd-search-result"
        @click="close"
      >
        <span class="hd-search-result-title">{{ item.title }}</span>
        <span v-if="item.crumb" class="hd-search-result-crumb">{{ item.crumb }}</span>
      </NuxtLink>
      <button class="hd-search-history-btn hd-search-ask" type="button" @click="submit">
        <span aria-hidden="true">✦</span>
        <span>Спросить ИИ-агента: «{{ query.trim() }}»</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { openChat } = useHdChat()

const query = ref('')
const historyOpen = ref(false)
const history = ref<string[]>([])

type Section = { id: string, title: string, titles: string[], content: string, level: number }
const { data: sections } = await useLazyAsyncData('hd-search-sections', () => queryCollectionSearchSections('docs'), { default: () => [] as Section[] })

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
const results = computed(() => {
  const q = norm(query.value.trim())
  if (q.length < 2) return []
  const words = q.split(/\s+/).filter(Boolean)
  return (sections.value || [])
    .map((s) => {
      const title = norm(s.title || ''), text = norm(s.content || '')
      let score = 0
      for (const w of words) {
        if (title.includes(w)) score += 3
        else if (text.includes(w)) score += 1
        else return null
      }
      return { id: s.id, title: s.title, crumb: (s.titles || []).join(' › '), score }
    })
    .filter((r): r is NonNullable<typeof r> => !!r)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
})

onMounted(() => {
  try { history.value = JSON.parse(localStorage.getItem('hd-search-history') || '[]') } catch { history.value = [] }
  document.addEventListener('click', onDocumentClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

function onDocumentClick(e: MouseEvent) {
  if (!(e.target as HTMLElement)?.closest?.('.hd-search-wrap')) historyOpen.value = false
}

function remember(q: string) {
  const next = [q, ...history.value.filter(i => i !== q)].slice(0, 5)
  history.value = next
  try { localStorage.setItem('hd-search-history', JSON.stringify(next)) } catch { /* пустяк */ }
}

// Enter и «→» — вопрос ИИ-агенту. Страницу из результатов выбирают кликом.
function submit() {
  const q = query.value.trim()
  if (q.length < 2) return
  remember(q)
  openChat(q)
  close()
}

function pick(item: string) { query.value = item }
function close() { historyOpen.value = false; query.value = '' }
</script>

<style scoped>
.hd-search-wrap { position: relative; width: 100%; min-width: 0; max-width: 560px; }
.hd-search-result { flex-direction: column; align-items: flex-start; gap: 2px; text-decoration: none; }
.hd-search-result-crumb { font-size: 12px; color: var(--hd-text-tertiary); }
.hd-search-ask { color: var(--hd-primary); border-top: 1px solid var(--hd-border); border-radius: 0; }
</style>
