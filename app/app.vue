<!--
  Оболочка приложения вместо штатной Docus: без её шапки, подвала, палитры поиска
  и боковой панели ассистента — всё это делает макет helpdesk (app/layouts/helpdesk.vue).
  Навигация по контенту собирается здесь и раздаётся вниз, как в Docus.
-->
<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'
import * as nuxtUiLocales from '@nuxt/ui/locale'

const appConfig = useAppConfig()
const site = useSiteConfig()
const nuxtUiLocale = nuxtUiLocales.ru

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'ru', dir: 'ltr' },
})

useSeoMeta({
  titleTemplate: appConfig.seo?.titleTemplate,
  title: appConfig.seo?.title,
  description: appConfig.seo?.description,
  ogSiteName: site.name,
  twitterCard: 'summary_large_image',
})

const { data: navigation } = await useAsyncData('navigation_docs', () => queryCollectionNavigation('docs'), {
  transform: (data: ContentNavigationItem[]) => transformNavigation(data, false, 'ru'),
})
provide('navigation', navigation)
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--hd-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
