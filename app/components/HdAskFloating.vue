<!--
  Плавающее поле «Задать вопрос» внизу страницы (на главной — после
  первого экрана): Ctrl+I — фокус,
  Enter — вопрос ИИ-агенту (открывается чат). Пока открыт чат — скрыто.
-->
<template>
  <form v-show="!chatOpen && !heroVisible" class="hd-ask-float" @submit.prevent="submit">
    <B24Input
      ref="input"
      v-model="q"
      class="hd-ask-float-input"
      no-border
      placeholder="Задать вопрос…"
      aria-label="Задать вопрос ИИ-агенту"
    />
    <B24Kbd value="ctrl" class="hd-ask-float-kbd" /><B24Kbd value="I" class="hd-ask-float-kbd" />
    <B24Button type="submit" color="air-primary" size="sm" :icon="icon('send')" :disabled="!q.trim()" aria-label="Отправить" />
  </form>
</template>

<script setup lang="ts">
const { open: chatOpen, openChat } = useHdChat()
const q = ref('')

// На главной поле появляется, когда большой поиск первого экрана ушёл за шапку
const heroVisible = ref(false)
const onScroll = () => {
  const hero = document.querySelector('.hd-search-wrap--hero')
  heroVisible.value = !!hero && hero.getBoundingClientRect().bottom > 59
}
const input = ref<{ $el?: HTMLElement } | null>(null)

function submit() {
  if (!q.value.trim()) return
  openChat(q.value)
  q.value = ''
}

const onKey = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); input.value?.$el?.querySelector('input')?.focus() }
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', onScroll)
})
// переход между страницами: на главной снова проверить, виден ли большой поиск
watch(() => useRoute().path, () => nextTick(onScroll))
</script>

<style scoped>
.hd-ask-float {
  position: fixed;
  bottom: 24px;
  left: calc(50% + var(--hd-sidebar-width) / 2);
  z-index: 75;
  display: flex;
  align-items: center;
  gap: 6px;
  width: min(380px, calc(100vw - 32px));
  padding: 6px 6px 6px 14px;
  border: 1px solid var(--hd-input-border);
  border-radius: 12px;
  background: var(--hd-float-bg);
  box-shadow: var(--hd-float-shadow);
  transform: translateX(-50%);
}
.hd-ask-float:focus-within { border-color: var(--hd-primary); }
.hd-ask-float-input { flex: 1; min-width: 0; }
.hd-ask-float-input :deep(input) { background: transparent; font-size: 14px; }
@media (max-width: 767px) { .hd-ask-float-kbd { display: none; } }
</style>
