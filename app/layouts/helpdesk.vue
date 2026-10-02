<!--
  Макет сайта: белая шапка, слева — меню B24DashboardSidebar (как в bitrix24/templates-dashboard:
  сворачивается до иконок кнопкой внизу, ширина запоминается; на телефоне — панель по кнопке в шапке), по центру —
  секции на градиентном фоне или статья на белом листе с оглавлением справа.
  Чат с ИИ-агентом — оверлей поверх страницы, открывается из поиска.
-->
<template>
  <div class="hd-shell" :class="{ 'hd-shell--plain': article, 'hd-shell--chat': chatOpen }">
  <B24DashboardGroup unit="px" storage="local" storage-key="hd-menu" :b24ui="{ base: 'static block overflow-visible' }">
    <HdHeader />

    <div class="hd-body">
    <B24DashboardSidebar
      id="hd-menu"
      mode="slideover"
      collapsible
      :toggle="false"
      :default-size="260"
      :min-size="220"
      :max-size="300"
      :collapsed-size="64"
      class="hd-sidebar"
    >
      <template #default="{ collapsed }">
        <HdMenu :collapsed="collapsed" />
      </template>
      <template #footer="{ collapsed }">
        <HdMenuFooter :collapsed="collapsed" />
      </template>
    </B24DashboardSidebar>

    <div class="hd-page">
    <div class="hd-main">
      <div v-if="article" class="hd-article-layout">
        <div class="hd-article">
          <div class="hd-article-head">
            <HdBreadcrumbs :items="breadcrumbs" />
            <span class="hd-article-head-actions">
              <HdCopyPage :markdown="docPage" />
            </span>
          </div>
          <slot />
          <HdArticleRating v-if="docPage" />
        </div>
        <aside class="hd-aside">
          <HdToc v-if="tocLinks.length" :links="tocLinks" />
          <HdDiscussAi v-if="docPage" :title="pageTitle" />
        </aside>
      </div>

      <div v-else class="hd-content">
        <slot />
      </div>
    </div>

    <footer class="hd-footer">
      <div class="hd-footer-inner">
        <NuxtLink to="/" class="hd-footer-logo">bxshef</NuxtLink>
        <div class="hd-footer-socials">
          <a href="https://github.com/bx-shef" target="_blank" rel="noopener" title="GitHub"><HdIcon name="github" /></a>
          <a href="/llms.txt" target="_blank" title="llms.txt для ИИ-агентов"><HdIcon name="bot" /></a>
          <a href="https://agentskills.io" target="_blank" rel="noopener" title="Agent Skills"><HdIcon name="sparkles" /></a>
        </div>
      </div>
    </footer>
    </div>
    </div>
  </B24DashboardGroup>

    <HdScrollTop />
    <HdAskFloating />

    <ClientOnly>
      <HdChatOverlay :open="chatOpen" @close="closeChat()" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  article?: boolean
  pageTitle?: string
  docPage?: boolean   // страница документации: есть /raw/*.md и её можно обсудить с ИИ
  tocLinks?: Array<{ id: string, text: string, depth: number }>
  breadcrumbs?: Array<{ title: string, path?: string }>
}>(), { article: false, docPage: true, tocLinks: () => [], breadcrumbs: () => [] })

const { open: chatOpen, closeChat } = useHdChat()

// Фон страницы: на статье — почти белый, градиент — на главной и списках
const props_ = getCurrentInstance()?.props as { article?: boolean }
useHead({ bodyAttrs: { class: computed(() => props_?.article ? 'hd-body-plain' : '') } })

</script>
