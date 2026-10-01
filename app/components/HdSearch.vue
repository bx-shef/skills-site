<!--
  Поиск с историей запросов, как в «Битрикс24 Ответы». Два вида: компактный
  в шапке и большой (hero) на первом экране — с аватаром ИИ и круглой кнопкой.
  Ищет по заголовкам и тексту разделов всех страниц (queryCollectionSearchSections).
  Enter и кнопка «отправить» задают вопрос ИИ-агенту — открывается чат-оверлей.
-->
<template>
  <div class="hd-search-wrap" :class="{ 'hd-search-wrap--hero': hero }" @keydown.escape="close">
    <div :class="hero ? 'hd-search-box' : 'hd-search-row'">
      <span v-if="hero" class="hd-search-avatar" aria-hidden="true"><HdStar /></span>

      <div class="hd-search">
        <HdStar v-if="!hero" class="hd-search-star" />
        <input
          v-model="query"
          class="hd-search-input"
          type="search"
          :placeholder="placeholder"
          aria-label="Поиск по сайту"
          autocomplete="off"
          @focus="historyOpen = true"
          @keydown.enter.prevent="submit"
        >
        <button
          class="hd-search-history-toggle"
          type="button"
          aria-label="История запросов"
          title="История запросов"
          @click.stop="historyOpen = !historyOpen"
        >
          <HdIcon name="history" />
        </button>
        <button
          v-if="hero"
          class="hd-search-send"
          type="button"
          aria-label="Спросить ИИ-агента"
          :disabled="query.trim().length < 2"
          @click="submit"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.5 2.3c0-.6.7-1 1.2-.7l9 5.7c.5.3.5 1 0 1.4l-9 5.7c-.5.3-1.2-.1-1.2-.7V2.3Z" /></svg>
        </button>
      </div>

      <button
        v-if="!hero"
        class="hd-search-send"
        type="button"
        aria-label="Спросить ИИ-агента"
        :disabled="query.trim().length < 2"
        @click="submit"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 3.5 17 10 3.5 16.5 6 10 3.5 3.5Z" /><path d="M6 10h5" stroke-linecap="round" /></svg>
      </button>
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
        <HdIcon name="history" />
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
        <HdStar class="hd-search-star" />
        <span>Спросить ИИ-агента: «{{ query.trim() }}»</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  hero: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Напишите вопрос. Например: как написать навык для модуля?' },
})

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

const root = getCurrentInstance()
onMounted(() => {
  try { history.value = JSON.parse(localStorage.getItem('hd-search-history') || '[]') } catch { history.value = [] }
  document.addEventListener('click', onDocumentClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick))

// Закрываем список по клику мимо именно этого поиска: их на главной два
function onDocumentClick(e: MouseEvent) {
  const el = root?.proxy?.$el as HTMLElement | undefined
  if (el && !el.contains(e.target as Node)) historyOpen.value = false
}

function remember(q: string) {
  const next = [q, ...history.value.filter(i => i !== q)].slice(0, 5)
  history.value = next
  try { localStorage.setItem('hd-search-history', JSON.stringify(next)) } catch { /* пустяк */ }
}

// Enter и «отправить» — вопрос ИИ-агенту. Страницу из результатов выбирают кликом.
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
.hd-search-row { display: flex; align-items: center; gap: 12px; }
.hd-search-result { flex-direction: column; align-items: flex-start; gap: 2px; }
.hd-search-result-title { color: var(--hd-text-primary); }
.hd-search-result-crumb { font-size: 12px; color: var(--hd-text-tertiary); }
.hd-search-ask { color: var(--hd-primary); }
</style>
