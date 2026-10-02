<!-- Кнопка «Наверх»: появляется после первого экрана -->
<template>
  <B24Button
    class="scroll-to-top"
    :class="{ 'scroll-to-top--visible': visible }"
    color="air-secondary-no-accent"
    size="lg"
    rounded
    :icon="icon('chevron-up')"
    aria-label="Наверх"
    @click="toTop"
  />
</template>

<script setup lang="ts">
const visible = ref(false)
const onScroll = () => { visible.value = window.scrollY > window.innerHeight * 0.6 }
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })
onMounted(() => { onScroll(); window.addEventListener('scroll', onScroll, { passive: true }) })
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.scroll-to-top {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 70;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px);
  transition: opacity .2s ease, visibility .2s ease, transform .2s ease, box-shadow .2s ease;
}
.scroll-to-top--visible { opacity: 1; visibility: visible; transform: none; }
.scroll-to-top:hover { box-shadow: 0 6px 24px rgba(0, 0, 0, .18); }
/* на узком экране — над плавающим полем «Задать вопрос» */
@media (max-width: 767px) { .scroll-to-top { right: 16px; bottom: 84px; } }
</style>
