<!--
  Оболочка: Bitrix24 UI (B24App) и навигация по контенту, которую раздаём вниз —
  её берут «Все темы» и крошки статей.
-->
<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const appConfig = useAppConfig()

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  titleTemplate: (t?: string) => t ? `${t} · bxshef` : appConfig.seo.title,
})

const { data: navigation } = await useAsyncData('navigation_docs', () => queryCollectionNavigation('docs', ['description']))
provide('navigation', navigation as Ref<ContentNavigationItem[]>)
</script>

<template>
  <B24App>
    <NuxtLoadingIndicator color="#0075ff" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </B24App>
</template>
