<!-- Крошки над статьёй: B24Breadcrumb, всегда в одну строку. На узком экране — «Главная › … › раздел»:
     текущая страница и так стоит заголовком под крошками, а полный путь на телефоне не помещается. -->
<template>
  <B24Breadcrumb :items="crumbs" class="hd-breadcrumbs" :b24ui="{ list: 'flex-nowrap min-w-0', item: 'min-w-0', link: 'min-w-0', linkLabel: 'truncate' }" />
</template>

<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const props = defineProps<{ items: Array<{ title: string, path?: string }> }>()
const narrow = useMediaQuery('(max-width: 767px)')

const crumbs = computed(() => {
  const all = [{ label: 'Главная', to: '/' }, ...props.items.map(i => ({ label: i.title, to: i.path }))]
  const current = all.length - 1
  // последний пункт — текущая страница, без ссылки
  const full = all.map((c, i) => (i === current ? { label: c.label } : c))
  if (!narrow.value || all.length <= 2) return full
  const parent = all[current - 1]!
  return current - 1 > 1 ? [all[0]!, { label: '…' }, parent] : [all[0]!, parent]
})
</script>
