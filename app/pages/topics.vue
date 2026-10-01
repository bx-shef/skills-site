<!--
  «Все темы» — как allSections.php в «Битрикс24 Ответы»: заголовок с иконкой,
  по разделу сайта — белая панель с темами в две колонки (иконка, название, описание).
  Разделы и темы — из навигации Nuxt Content.
-->
<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

definePageMeta({ layout: false })
useSeo({ title: 'Все темы', description: 'Методология, навыки и модули shef.* — все разделы сайта', type: 'website' })

const navigation = inject<Ref<ContentNavigationItem[]>>('navigation', ref([]))

const icons: Record<string, string> = {
  '/methodology/standard': 'ruler',
  '/methodology/method': 'question',
  '/methodology/bxshef': 'terminal',
  '/methodology/action': 'code',
  '/methodology/template': 'folder',
  '/methodology/feedback': 'feedback',
  '/methodology/feedback-vibecode': 'cloud',
}

type Topic = { path: string, title: string, text: string, icon: string }
const groups = computed(() => (navigation.value || [])
  .filter(n => n.path !== '/' && n.children?.length)
  .map((n) => {
    const own = n.children!.find(c => c.path === n.path)
    const topics: Topic[] = []
    if (own) topics.push({ path: own.path, title: 'Обзор раздела', text: String(own.description || ''), icon: 'compass' })
    for (const c of n.children!) {
      if (c.path === n.path) continue
      const index = c.children?.find(x => x.path === c.path)
      topics.push({
        path: c.path,
        title: c.title,
        text: String(c.description || index?.description || (c.children ? `${c.children.length} страниц` : '')),
        icon: icons[c.path] || (n.icon as string) || 'book',
      })
    }
    return { title: n.title, path: n.path, topics }
  }))
</script>

<template>
  <NuxtLayout name="helpdesk">
    <div class="hd-article-head" style="padding-bottom: 0">
      <HdBreadcrumbs :items="[{ title: 'Все темы' }]" />
    </div>

    <div class="hd-topics-head">
      <h1 class="hd-topics-title">
        <span class="hd-topics-badge"><HdIcon name="compass" /></span>
        База знаний
      </h1>
      <p class="hd-topics-sub">Все темы</p>
    </div>

    <section v-for="g in groups" :key="g.path" class="hd-section" style="padding: 48px 0 0">
      <h2 class="hd-section-title">{{ g.title }}</h2>
      <div class="hd-topics-panel">
        <NuxtLink v-for="t in g.topics" :key="t.path" :to="t.path" class="hd-topic">
          <span class="hd-topic-icon"><HdIcon :name="t.icon" /></span>
          <span>
            <p class="hd-topic-title">{{ t.title }}</p>
            <p v-if="t.text" class="hd-topic-text">{{ t.text }}</p>
          </span>
        </NuxtLink>
      </div>
    </section>
    <div style="height: 80px" />
  </NuxtLayout>
</template>
