<!--
  Макет по образцу «Битрикс24 Ответы» (helpdesk.bitrix24.ru/widget2/):
  белая шапка с поиском, меню-иконки 84px слева (раскрывается по наведению), по центру —
  секции на градиентном фоне или статья на белом листе с оглавлением справа.
  Чат с ИИ-агентом — оверлей поверх страницы, открывается из поиска.
-->
<template>
  <div class="hd-shell" :class="{ 'hd-shell--plain': article, 'hd-shell--chat': chatOpen }">
    <HdHeader />

    <aside class="hd-sidebar sidebar-menu">
      <HdMenu />
    </aside>

    <div class="hd-main">
      <div v-if="article" class="hd-article-layout">
        <div class="hd-article">
          <div class="hd-article-head">
            <HdBreadcrumbs :items="breadcrumbs" />
            <span class="hd-article-head-actions">
              <HdCopyPage v-if="docPage" />
              <button class="hd-icon-btn" type="button" :title="copied ? 'Ссылка скопирована' : 'Скопировать ссылку на статью'" @click="copyLink">
                <HdIcon :name="copied ? 'check' : 'link'" />
              </button>
            </span>
          </div>
          <slot />
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

// Фон страницы: на статье — почти белый (как в оригинале), градиент — на главной и списках
const props_ = getCurrentInstance()?.props as { article?: boolean }
useHead({ bodyAttrs: { class: computed(() => props_?.article ? 'hd-body-plain' : '') } })

const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(location.href.split('#')[0])
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* буфер недоступен во фрейме без разрешения — молча */ }
}
</script>
