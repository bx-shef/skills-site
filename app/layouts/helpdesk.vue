<!--
  Макет по образцу виджета поддержки Битрикс24 (набор helpdesk-docus-kit):
  шапка с поиском, узкое меню слева, статья рядом с оглавлением.
  Чат с ИИ-агентом — оверлей поверх страницы, открывается из меню и из поиска.
-->
<template>
  <div class="hd-shell">
    <HdHeader :title="title" @toggle-menu="menuOpen = !menuOpen" />

    <aside class="hd-sidebar" :class="{ 'is-open': menuOpen }">
      <HdMenu @open-chat="openChat()" @navigate="menuOpen = false" />
    </aside>

    <div class="hd-main" @click="menuOpen && (menuOpen = false)">
      <div v-if="article" class="hd-article-layout">
        <div class="hd-article">
          <HdBreadcrumbs v-if="breadcrumbs.length" :items="breadcrumbs" />
          <slot />
        </div>
        <HdToc v-if="toc && tocLinks.length" :links="tocLinks" />
      </div>

      <div v-else class="hd-content">
        <HdBreadcrumbs v-if="breadcrumbs.length" :items="breadcrumbs" />
        <slot />
      </div>
    </div>

    <ClientOnly>
      <HdChatOverlay :open="chatOpen" @close="closeChat()" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
defineProps({
  title:       { type: String,  default: 'bxshef' },
  article:     { type: Boolean, default: false },
  toc:         { type: Boolean, default: true },
  tocLinks:    { type: Array as PropType<Array<{ id: string, text: string, depth: number }>>, default: () => [] },
  breadcrumbs: { type: Array as PropType<Array<{ title: string, path?: string }>>, default: () => [] },
})

const { open: chatOpen, menuOpen, openChat, closeChat } = useHdChat()
</script>
