<!--
  «Интеллектуальный поиск» — как search.php «Битрикс24 Ответы»: крошки, поле с
  крестиком и кнопкой-лупой, ниже — статьи карточками или «Нет статей».
  Ищет по словам в заголовках и тексте разделов страниц (queryCollectionSearchSections),
  результаты — по страницам, а не по разделам.
-->
<script setup lang="ts">
definePageMeta({ layout: false })
useSeo({ title: 'Интеллектуальный поиск', description: 'Поиск по методологии, навыкам и модулям shef.*' })

const route = useRoute()
const router = useRouter()
const query = ref(String(route.query.q || ''))
watch(() => route.query.q, (q) => { query.value = String(q || '') })

type Section = { id: string, title: string, titles: string[], content: string, level: number }
const { data: sections } = await useAsyncData('search-sections', () => queryCollectionSearchSections('docs'), { default: () => [] as Section[] })

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')
const results = computed(() => {
  const words = norm(String(route.query.q || '')).split(/[^a-zа-я0-9_.\-]+/).filter(w => w.length >= 2)
  if (!words.length) return []
  const pages = new Map<string, { path: string, title: string, excerpt: string, score: number }>()
  for (const s of sections.value || []) {
    const title = norm(s.title || ''), text = norm(s.content || '')
    let score = 0
    for (const w of words) score += (title.includes(w) ? 3 : 0) + (text.includes(w) ? 1 : 0)
    if (!score) continue
    const path = s.id.split('#')[0] || s.id
    const prev = pages.get(path)
    if (!prev || score > prev.score) {
      pages.set(path, {
        path: s.id,
        title: s.level === 1 ? s.title : [s.titles?.[0], s.title].filter(Boolean).join(' — '),
        excerpt: (s.content || '').replace(/\s+/g, ' ').slice(0, 260),
        score: (prev?.score || 0) + score,
      })
    } else prev.score += score
  }
  return [...pages.values()].sort((a, b) => b.score - a.score).slice(0, 20)
})

function submit() { router.push({ path: '/search', query: query.value.trim() ? { q: query.value.trim() } : {} }) }
function clear() { query.value = ''; router.push({ path: '/search' }) }
</script>

<template>
  <NuxtLayout name="helpdesk">
    <div class="hd-article-head" style="padding-bottom: 0">
      <HdBreadcrumbs :items="[{ title: 'Интеллектуальный поиск' }]" />
    </div>

    <form class="hd-isearch" role="search" @submit.prevent="submit">
      <div class="hd-isearch-field">
        <input v-model="query" type="search" placeholder="Что вы ищете?" aria-label="Поисковый запрос" autofocus>
        <button v-if="query" type="button" class="hd-isearch-clear" aria-label="Очистить" @click="clear">
          <HdIcon name="close" />
        </button>
      </div>
      <button type="submit" class="hd-isearch-btn" aria-label="Найти">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6.25" stroke="currentColor" stroke-width="1.5" /><path d="m13.6 13.6 3.9 3.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
      </button>
    </form>

    <div v-if="results.length" class="hd-articles hd-isearch-results">
      <NuxtLink v-for="r in results" :key="r.path" :to="r.path" class="hd-article-card">
        <h3 class="hd-article-card-title">{{ r.title }}</h3>
        <p class="hd-article-card-text">{{ r.excerpt }}</p>
      </NuxtLink>
    </div>

    <div v-else-if="route.query.q" class="hd-isearch-empty">
      <span class="hd-isearch-empty-art" aria-hidden="true"><HdIcon name="question" /></span>
      <p class="hd-isearch-empty-title">Нет статей</p>
      <p class="hd-isearch-empty-text">Попробуйте ввести другой запрос</p>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.hd-isearch { display: flex; gap: 12px; max-width: 840px; margin: 40px auto 0; }
.hd-isearch-field {
  flex: 1;
  display: flex;
  align-items: center;
  height: 50px;
  padding: 0 12px 0 14px;
  border: 1px solid #e3e8f0;
  border-radius: 12px;
  background: #fff;
}
.hd-isearch-field:focus-within { border-color: var(--hd-primary); }
.hd-isearch-field input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: 17px; color: #000; }
.hd-isearch-field input::-webkit-search-cancel-button { display: none; }
.hd-isearch-clear { display: inline-flex; padding: 4px; border: 0; border-radius: 6px; background: transparent; color: #525c69; font-size: 18px; cursor: pointer; }
.hd-isearch-clear:hover { background: var(--hd-hover-bg); }
.hd-isearch-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border: 1px solid #e3e8f0;
  border-radius: 12px;
  background: #fff;
  color: #333;
  cursor: pointer;
}
.hd-isearch-btn:hover { border-color: var(--hd-primary); color: var(--hd-primary); }
.hd-isearch-results { max-width: 840px; margin: 32px auto 80px; }
.hd-isearch-empty { display: flex; flex-direction: column; align-items: center; padding: 140px 0 160px; text-align: center; }
.hd-isearch-empty-art {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  margin-bottom: 24px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ffd9cf, #f7a99a);
  box-shadow: 0 18px 30px rgba(240, 140, 120, .3);
  color: #fff;
  font-size: 54px;
}
.hd-isearch-empty-title { margin: 0 0 8px; font-size: 19px; font-weight: 500; color: #000; }
.hd-isearch-empty-text { margin: 0; font-size: 15px; color: var(--hd-text-secondary); }
</style>
