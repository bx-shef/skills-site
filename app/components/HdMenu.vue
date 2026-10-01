<!--
  Меню слева: иконка плюс подпись. В свёрнутом виде (84px) видны только иконки,
  подписи появляются при наведении. Разделы — из навигации Nuxt Content
  (content/*/.navigation.yml), последний пункт открывает чат с ИИ-агентом.
-->
<template>
  <ul class="hd-menu">
    <li v-for="item in items" :key="item.path || item.action">
      <NuxtLink
        v-if="item.path"
        :to="item.path"
        :external="item.external"
        :target="item.external ? '_blank' : undefined"
        class="hd-menu-item"
        :class="{ 'router-link-active': isActive(item.path) }"
        @click="$emit('navigate')"
      >
        <span class="hd-menu-icon" aria-hidden="true">
          <UIcon v-if="item.icon" :name="item.icon" class="hd-menu-svg" />
          <template v-else>{{ item.glyph }}</template>
        </span>
        <span class="hd-menu-label">{{ item.title }}</span>
      </NuxtLink>

      <button v-else class="hd-menu-item" type="button" @click="$emit(item.action)">
        <span class="hd-menu-icon" aria-hidden="true">
          <UIcon :name="item.icon" class="hd-menu-svg" />
        </span>
        <span class="hd-menu-label">{{ item.title }}</span>
      </button>
    </li>
  </ul>
</template>

<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

defineEmits(['open-chat', 'navigate'])

type Item = { path?: string, action?: 'open-chat', icon?: string, glyph?: string, title: string, external?: boolean }

const route = useRoute()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation', ref([]))

const items = computed<Item[]>(() => {
  const sections = (navigation?.value || [])
    .filter(n => n.path !== '/' && (n.children?.length || n.path))
    .map(n => ({ path: n.path, icon: (n.icon as string) || 'i-lucide-folder', title: n.title }))
  return [
    { path: '/', icon: 'i-lucide-house', title: 'Главная' },
    ...sections,
    { path: '/llms.txt', external: true, icon: 'i-lucide-bot', title: 'llms.txt для ИИ-агентов' },
    { action: 'open-chat', icon: 'i-lucide-message-circle', title: 'Спросить ИИ-агента' },
  ]
})

// Раздел активен и на вложенных страницах: /methodology/standard подсвечивает «Методология»
const isActive = (path: string) => path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(path + '/')
</script>

<style scoped>
button.hd-menu-item {
  width: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.hd-menu-svg { width: 22px; height: 22px; display: block; }
</style>
