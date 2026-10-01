<!-- Главная: content/index.md в макете helpdesk (обычная страница, без оглавления) -->
<script setup lang="ts">
definePageMeta({ layout: false })

const { data: page } = await useAsyncData('landing', () => queryCollection('landing').path('/').first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description
useSeo({ title, description, type: 'website' })
defineOgImage('Landing', { title: title?.slice(0, 60), description: formatOgDescription(title, description) })
</script>

<template>
  <NuxtLayout name="helpdesk" :article="false">
    <div class="hd-article hd-home">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </NuxtLayout>
</template>

<style scoped>
.hd-home { padding-top: var(--hd-space-3xl); }
</style>
