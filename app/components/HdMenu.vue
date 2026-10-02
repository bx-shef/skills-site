<!--
  Левое меню: колонка 84px с иконками 30px,
  по наведению раскрывается с подписями поверх страницы. Видно первые 9 пунктов,
  остальные — по «Показать все». Внизу — «Поддержка» (у нас — чат с ИИ-агентом).
  Пункты — разделы и страницы из навигации контента.
-->
<template>
  <div class="sidebar-menu__panel">
    <nav class="sidebar-menu__nav" aria-label="Меню сайта">
      <NuxtLink
        v-for="item in visible"
        :key="item.path"
        :to="item.path"
        class="sidebar-menu__item"
        :class="{ 'is-active': isActive(item.path) }"
        :title="item.title"
      >
        <span class="sidebar-menu__icon-wrapper" aria-hidden="true"><HdIcon :name="item.icon" class="sidebar-menu__icon" /></span>
        <span class="sidebar-menu__item-text">{{ item.title }}</span>
      </NuxtLink>

      <button v-if="hidden.length" type="button" class="sidebar-menu__item sidebar-menu__show-all-btn" @click="all = !all">
        <span class="sidebar-menu__item-text">{{ all ? 'Свернуть' : 'Показать все' }}</span>
        <span class="sidebar-menu__icon-wrapper" aria-hidden="true">
          <svg class="sidebar-menu__show-all-icon" :class="{ 'is-open': all }" width="16" height="9" viewBox="0 0 16 9" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.8 8.8c.27.27.72.27.99 0l7-7a.7.7 0 0 0-.99-.99L8.3 7.31 1.8.8a.7.7 0 0 0-.99.99l7 7Z" fill="currentColor" /></svg>
        </span>
      </button>

      <template v-if="all">
        <NuxtLink
          v-for="item in hidden"
          :key="item.path"
          :to="item.path"
          class="sidebar-menu__item"
          :class="{ 'is-active': isActive(item.path) }"
          :title="item.title"
        >
          <span class="sidebar-menu__icon-wrapper" aria-hidden="true"><HdIcon :name="item.icon" class="sidebar-menu__icon" /></span>
          <span class="sidebar-menu__item-text">{{ item.title }}</span>
        </NuxtLink>
      </template>
    </nav>

    <div class="sidebar-menu__support">
      <button type="button" class="sidebar-menu__item" title="Поддержка" @click="openChat()">
        <span class="sidebar-menu__icon-wrapper" aria-hidden="true"><HdIcon name="help" class="sidebar-menu__icon sidebar-menu__support-icon" /></span>
        <span class="sidebar-menu__item-text">Поддержка</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const route = useRoute()
const { openChat } = useHdChat()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation', ref([]))
const all = ref(false)

const icons: Record<string, string> = {
  '/methodology': 'knowledge',
  '/methodology/standard': 'ruler',
  '/methodology/method': 'question',
  '/methodology/bxshef': 'terminal',
  '/methodology/action': 'code',
  '/methodology/template': 'folder',
  '/methodology/feedback': 'feedback',
  '/methodology/feedback-vibecode': 'cloud',
  '/skills': 'sparkles',
  '/modules': 'package',
}

// Разделы и их прямые подразделы/страницы, без страницы-обзора раздела (она — сам раздел)
const items = computed(() => {
  const out: Array<{ path: string, title: string, icon: string }> = [{ path: '/topics', title: 'Все темы', icon: 'compass' }]
  for (const n of navigation.value || []) {
    if (n.path === '/') continue
    out.push({ path: n.path, title: n.title, icon: icons[n.path] || (n.icon as string) || 'book' })
    for (const c of n.children || []) {
      if (c.path === n.path) continue
      out.push({ path: c.path, title: c.title, icon: icons[c.path] || (c.children ? 'package' : 'book') })
    }
  }
  return out
})
const visible = computed(() => items.value.slice(0, 9))
const hidden = computed(() => items.value.slice(9))

// Подсвечиваем один пункт — самый точный: на /methodology/standard это «Стандарт», а не ещё и «Методология»
const activePath = computed(() => items.value
  .map(i => i.path)
  .filter(p => route.path === p || route.path.startsWith(p + '/'))
  .sort((a, b) => b.length - a.length)[0])
const isActive = (path: string) => path === activePath.value
</script>
