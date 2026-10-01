<!--
  Страница документации в макете helpdesk: статья рядом с оглавлением,
  крошки из навигации, внизу — ссылка на исходник (её ставит sync-content) и соседи.
  
-->
<script setup lang="ts">
import { kebabCase } from 'scule'
import type { ContentNavigationItem } from '@nuxt/content'

definePageMeta({ layout: false })

const route = useRoute()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')

const [{ data: page }, { data: surround }] = await Promise.all([
  useAsyncData(kebabCase(route.path), () => queryCollection('docs').path(route.path).first()),
  useAsyncData(`${kebabCase(route.path)}-surround`, () => queryCollectionItemSurroundings('docs', route.path, { fields: ['description'] })),
])

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.title
const description = page.value.description

const breadcrumbs = computed(() => {
  const found = findPageBreadcrumbs(navigation?.value, page.value?.path || '') || []
  // текущая страница — последняя крошка без ссылки; раздел-индекс не дублируем
  return found.filter((b, i, a) => !(i === a.length - 2 && b.path === a[a.length - 1]?.path))
})

const tocLinks = computed(() => page.value?.body?.toc?.links || [])
// Плашка «В статье:» под заголовком — те же разделы второго уровня, не больше восьми
const previewLinks = computed(() => tocLinks.value.filter((l: { depth: number }) => l.depth === 2).slice(0, 8))

useSeo({ title, description, type: 'article', markdown: `/raw${route.path.replace(/\/$/, '')}.md` })
// Markdown страницы (/raw/<путь>.md) — в пререндер: на него ведёт «Копировать страницу»
prerenderRoutes(`/raw${route.path.replace(/\/$/, '')}.md`)
</script>

<template>
  <NuxtLayout
    name="helpdesk"
    :article="true"
    :page-title="page?.title"
    :toc-links="tocLinks"
    :breadcrumbs="breadcrumbs"
  >
    <div class="hd-article-title-wrap">
      <h1>{{ page?.title }}</h1>
    </div>
    <p v-if="page?.description" class="hd-lead">{{ page.description }}</p>

    <div v-if="previewLinks.length > 1" class="hd-toc-preview">
      <p>В статье:</p>
      <ul>
        <li v-for="link in previewLinks" :key="link.id"><a :href="`#${link.id}`">{{ link.text }}</a></li>
      </ul>
    </div>

    <ContentRenderer v-if="page" :value="page" />

    <nav v-if="surround?.some(Boolean)" class="hd-surround" aria-label="Соседние страницы">
      <NuxtLink v-if="surround?.[0]" :to="surround[0].path" class="hd-surround-link">
        <span class="hd-surround-dir">← Назад</span>
        <span>{{ surround[0].title }}</span>
      </NuxtLink>
      <span v-else />
      <NuxtLink v-if="surround?.[1]" :to="surround[1].path" class="hd-surround-link hd-surround-link--next">
        <span class="hd-surround-dir">Дальше →</span>
        <span>{{ surround[1].title }}</span>
      </NuxtLink>
    </nav>
  </NuxtLayout>
</template>

<style scoped>
.hd-lead { margin: 0 0 var(--hd-space-xl); color: var(--hd-text-secondary); }
.hd-surround {
  display: flex;
  justify-content: space-between;
  gap: var(--hd-space-xl);
  margin-top: var(--hd-space-3xl);
  padding-top: var(--hd-space-2xl);
  font-size: 15px;
  border-top: 1px solid var(--hd-border);
}
.hd-surround-link { display: flex; flex-direction: column; gap: 2px; color: var(--hd-text-primary); text-decoration: none; font-size: var(--hd-size-sm); }
.hd-surround-link:hover { color: var(--hd-primary); text-decoration: none; }
.hd-surround-link--next { text-align: right; align-items: flex-end; }
.hd-surround-dir { font-size: 12px; color: var(--hd-text-tertiary); }
</style>
