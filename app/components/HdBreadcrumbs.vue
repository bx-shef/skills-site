<!-- Крошки над статьёй, как в «Битрикс24 Ответы»: стрелки «назад/вперёд» по истории, потом путь -->
<template>
  <nav class="hd-breadcrumbs" aria-label="Путь к странице">
    <span class="hd-breadcrumbs-nav">
      <button class="hd-icon-btn" type="button" aria-label="Назад" @click="router.back()">
        <UIcon name="i-lucide-chevron-left" />
      </button>
      <button class="hd-icon-btn" type="button" aria-label="Вперёд" :disabled="!canForward" @click="router.forward()">
        <UIcon name="i-lucide-chevron-right" />
      </button>
    </span>
    <NuxtLink to="/">Главная</NuxtLink>
    <template v-for="(item, i) in items" :key="item.path || i">
      <span class="hd-breadcrumbs-sep" aria-hidden="true"><UIcon name="i-lucide-chevron-right" /></span>
      <!-- последняя крошка — текущая страница, ссылкой не делаем -->
      <span v-if="i === items.length - 1" aria-current="page">{{ item.title }}</span>
      <NuxtLink v-else :to="item.path">{{ item.title }}</NuxtLink>
    </template>
  </nav>
</template>

<script setup lang="ts">
defineProps<{ items: Array<{ title: string, path?: string }> }>()
const router = useRouter()
// «Вперёд» активна, только если в истории браузера есть куда идти
const canForward = ref(false)
const sync = () => { canForward.value = !!window.history.state?.forward }
onMounted(sync)
watch(() => router.currentRoute.value.fullPath, () => nextTick(sync))
</script>
