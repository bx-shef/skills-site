<!--
  Главная по образцу «Битрикс24 Ответы»: первый экран с ИИ-поиском, плитки тем,
  промо-карточки, «Решение найдётся всегда», самые нужные статьи.
  content/index.md остаётся источником заголовка и описания (и текста для llms-full.txt).
-->
<script setup lang="ts">
definePageMeta({ layout: false })

const { data: page } = await useAsyncData('landing', () => queryCollection('landing').path('/').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description
useSeo({ title, description, type: 'website' })

const { openChat } = useHdChat()

// Плитки тем — как «С чего начать / Мессенджер / Задачи…» в оригинале
const tiles = [
  { to: '/methodology/standard', icon: 'ruler', title: 'Стандарт навыка', text: '11 правил, каждое — из провала на стенде' },
  { to: '/methodology/method', icon: 'question', title: 'Методология проверки', text: 'lint → eval → стенд: что и как измерено' },
  { to: '/methodology/bxshef', icon: 'terminal', title: 'bxshef — CLI', text: 'lint, eval, feedback для своих навыков' },
  { to: '/methodology/action', icon: 'code', title: 'GitHub Action', text: 'Та же проверка в CI любого репозитория' },
  { to: '/skills', icon: 'sparkles', title: 'Навыки shef.*', text: 'Готовые навыки к модулям shef.options, shef.problems, shef.insync' },
  { to: '/modules', icon: 'package', title: 'Модули shef.*', text: 'Документация модулей для коробки Битрикс24 и БУС' },
]

// «Самые читаемые» — ключевые страницы; текст карточки — начало страницы
const featured = ['/methodology/standard', '/methodology/method', '/methodology/template', '/methodology/bxshef']
const { data: articles } = await useAsyncData('landing-articles', async () => {
  const items = await queryCollection('docs').where('path', 'IN', featured).all() 
  return featured
    .map(p => items.find(i => i.path === p))
    .filter(<T>(i: T | undefined): i is T => !!i)
    .map((i) => {
      const text = plainText(i.body).replace(/\s+/g, ' ').trim()
      return {
        path: i.path,
        title: i.title,
        excerpt: text.length > 300 ? text.slice(0, 300).replace(/\s\S*$/, '') + '…' : text,
        minutes: Math.max(1, Math.round(text.split(' ').length / 180)),
        sections: countTag(i.body, 'h2'),
      }
    })
})

const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many

// Сколько в странице заголовков нужного уровня (оглавление в выборке .all() приходит пустым)
function countTag(body: unknown, tag: string): number {
  const walk = (n: unknown): number => Array.isArray(n) ? (n[0] === tag ? 1 : 0) + n.slice(2).reduce((s: number, c) => s + walk(c), 0) : 0
  return ((body as { value?: unknown[] })?.value || []).reduce((s: number, n) => s + walk(n), 0)
}

// Текст из minimark-дерева Nuxt Content: ['p', {}, 'текст', ['code', {}, '…']]; код-блоки пропускаем
function plainText(body: unknown): string {
  const walk = (n: unknown): string => {
    if (typeof n === 'string') return n
    if (!Array.isArray(n)) return ''
    const [tag, , ...children] = n as [string, unknown, ...unknown[]]
    if (tag === 'pre' || tag === 'style' || tag === 'table') return ' '
    const inner = children.map(walk).join('')
    return /^(p|li|h\d|blockquote|div)$/.test(tag) ? inner + ' ' : inner
  }
  const value = (body as { value?: unknown[] })?.value || []
  return value.map(walk).join('')
}

// Поиск в шапке скрыт, пока виден большой поиск первого экрана — как в оригинале
const heroSearch = ref<HTMLElement>()
const heroSearchVisible = ref(true)
const onScroll = () => {
  const r = heroSearch.value?.getBoundingClientRect()
  heroSearchVisible.value = !r || r.bottom > 59
}
onMounted(() => { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }) })
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <NuxtLayout name="helpdesk" :search-hidden="heroSearchVisible">
    <section class="hd-hero">
      <div class="hd-hero-glow" aria-hidden="true" />
      <div class="hd-hero-content">
        <h1 class="hd-hero-title">
          <span class="hd-hero-brand">bxshef</span>
          <span class="hd-hero-word">Навыки</span>
        </h1>
        <div ref="heroSearch" style="width: 100%">
          <HdSearch hero />
        </div>
      </div>
    </section>

    <section class="hd-section hd-section--first">
      <div class="hd-grid">
        <NuxtLink v-for="(t, i) in tiles" :key="t.to" :to="t.to" class="hd-tile">
          <div class="hd-tile-image" :class="`hd-tone-${i + 1}`">
            <span class="hd-bubble hd-bubble--a" />
            <span class="hd-bubble hd-bubble--b" />
            <span class="hd-glass"><HdIcon :name="t.icon" /></span>
          </div>
          <div class="hd-tile-body">
            <h3 class="hd-tile-title">{{ t.title }}</h3>
            <p class="hd-tile-text">{{ t.text }}</p>
          </div>
        </NuxtLink>
      </div>
      <div class="hd-section-more">
        <NuxtLink to="/topics" class="hd-btn-pill">Все темы</NuxtLink>
      </div>
    </section>

    <section class="hd-section">
      <h2 class="hd-section-title">Всё для старта с bxshef</h2>
      <div class="hd-grid hd-grid--2">
        <div class="hd-promo hd-promo--blue">
          <div class="hd-promo-art hd-promo-art--blue" aria-hidden="true"><HdIcon name="folder" /></div>
          <div class="hd-promo-content">
            <h3 class="hd-promo-title">Заготовка репозитория</h3>
            <p class="hd-promo-text">Навыки, проверка и CI — с первого коммита</p>
            <div class="hd-promo-buttons">
              <NuxtLink to="/methodology/template" class="hd-btn-primary">Перейти</NuxtLink>
            </div>
          </div>
        </div>
        <div class="hd-promo hd-promo--purple">
          <div class="hd-promo-art hd-promo-art--purple" aria-hidden="true"><HdIcon name="download" /></div>
          <div class="hd-promo-content">
            <h3 class="hd-promo-title">Навыки в проект</h3>
            <p class="hd-promo-text">Одна команда — и ИИ-агент пишет по канону модуля: <code>npx skills add bx-shef/skills</code></p>
            <div class="hd-promo-buttons">
              <NuxtLink to="/skills" class="hd-btn-primary"><HdIcon name="sparkles" />Навыки</NuxtLink>
              <a href="https://github.com/bx-shef/skills" target="_blank" rel="noopener" class="hd-btn-primary"><HdIcon name="github" />GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="hd-section">
      <h2 class="hd-section-title">Для тех, кто хочет больше</h2>
      <div class="hd-grid">
        <div class="hd-promo hd-promo--cyan hd-promo--resource">
          <div class="hd-promo-art hd-promo-art--cyan" aria-hidden="true"><HdIcon name="bot" /></div>
          <div class="hd-promo-content">
            <h3 class="hd-promo-title">Сайт для ИИ-агентов</h3>
            <p class="hd-promo-text">Весь сайт одним файлом — отдайте его своему агенту</p>
            <div class="hd-promo-buttons">
              <a href="/llms.txt" target="_blank" class="hd-btn-primary">llms.txt</a>
              <a href="/llms-full.txt" target="_blank" class="hd-btn-primary">llms-full.txt</a>
            </div>
          </div>
        </div>
        <div class="hd-promo hd-promo--lilac hd-promo--resource">
          <div class="hd-promo-art hd-promo-art--purple" aria-hidden="true"><HdIcon name="feedback" /></div>
          <div class="hd-promo-content">
            <h3 class="hd-promo-title">Отзывы ИИ-агентов</h3>
            <p class="hd-promo-text">Что пригодилось и чего не хватило — после каждой задачи</p>
            <div class="hd-promo-buttons">
              <NuxtLink to="/methodology/feedback" class="hd-btn-primary">Приёмник отзывов</NuxtLink>
            </div>
          </div>
        </div>
        <div class="hd-promo hd-promo--sky hd-promo--resource">
          <div class="hd-promo-art hd-promo-art--blue" aria-hidden="true"><HdIcon name="github" /></div>
          <div class="hd-promo-content">
            <h3 class="hd-promo-title">Исходники</h3>
            <p class="hd-promo-text">Методология, CLI и навыки — MIT, правки через PR</p>
            <div class="hd-promo-buttons">
              <a href="https://github.com/bx-shef/skills-standard" target="_blank" rel="noopener" class="hd-btn-primary">Перейти</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="hd-section">
      <h2 class="hd-section-title">Решение найдётся всегда</h2>
      <div class="hd-grid hd-grid--2">
        <button type="button" class="hd-support-card" @click="openChat()">
          <span class="hd-support-icon"><HdIcon name="chat" /></span>
          <span class="hd-support-body">
            <span class="hd-support-title">Спросить ИИ-агента</span>
            <span class="hd-support-text">Отвечает по методологии, навыкам и документации модулей — со ссылками на страницы сайта.</span>
          </span>
        </button>
        <a href="https://github.com/bx-shef/skills-standard/issues" target="_blank" rel="noopener" class="hd-support-card">
          <span class="hd-support-icon"><HdIcon name="help" /></span>
          <span class="hd-support-body">
            <span class="hd-support-title">Написать автору</span>
            <span class="hd-support-text">Вопрос, ошибка в навыке или идея — заведите issue на GitHub, ответим там же.</span>
          </span>
        </a>
      </div>
    </section>

    <section v-if="articles?.length" class="hd-section" style="padding-bottom: 120px">
      <h2 class="hd-section-title">Самые читаемые статьи</h2>
      <div class="hd-articles">
        <NuxtLink v-for="a in articles" :key="a.path" :to="a.path" class="hd-article-card">
          <h3 class="hd-article-card-title">{{ a.title }}</h3>
          <p class="hd-article-card-text">{{ a.excerpt }}</p>
          <div class="hd-article-card-meta">
            <span class="hd-stat"><HdIcon name="list" />{{ a.sections }} {{ plural(a.sections, 'раздел', 'раздела', 'разделов') }}</span>
            <span class="hd-stat"><HdIcon name="clock" />{{ a.minutes }} мин</span>
          </div>
        </NuxtLink>
      </div>
      <div class="hd-section-more">
        <NuxtLink to="/topics" class="hd-btn-pill">Показать ещё</NuxtLink>
      </div>
    </section>
  </NuxtLayout>
</template>
