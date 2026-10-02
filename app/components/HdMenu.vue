<!--
  Левое меню: колонка 84px с иконками 30px,
  по наведению раскрывается с подписями поверх страницы. Видно первые 9 пунктов,
  остальные — по «Показать все». Внизу — «Поддержка» (у нас — чат с ИИ-агентом).
  Пункты — разделы и страницы из навигации контента.
-->
<template>
  <div class="sidebar-menu__panel" @mouseenter="hover = true" @mouseleave="hover = false" @focusin="hover = true" @focusout="hover = false">
    <B24NavigationMenu
      orientation="vertical"
      :collapsed="!hover"
      :items="navItems"
      class="sidebar-menu__nav"
      aria-label="Меню сайта"
    />
    <B24NavigationMenu
      orientation="vertical"
      :collapsed="!hover"
      :items="[{ label: 'Поддержка', icon: icon('help'), onSelect: () => openChat() }]"
      class="sidebar-menu__support"
    />
  </div>
</template>

<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const route = useRoute()
const { openChat } = useHdChat()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation', ref([]))
const all = ref(false)
// панель узкая (иконки), по наведению или фокусу раскрывается с подписями — B24NavigationMenu collapsed
const hover = ref(false)

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

const toNav = (i: { path: string, title: string, icon: string }) => ({ label: i.title, icon: icon(i.icon), to: i.path, active: isActive(i.path) })
const navItems = computed(() => [
  ...visible.value.map(toNav),
  ...(hidden.value.length ? [{ label: all.value ? 'Свернуть' : 'Показать все', icon: icon(all.value ? 'chevron-up' : 'chevron-down'), onSelect: (e: Event) => { e.preventDefault(); all.value = !all.value } }] : []),
  ...(all.value ? hidden.value.map(toNav) : []),
])
</script>
