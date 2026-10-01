<!-- Кнопка «Наверх», как scroll-to-top «Битрикс24 Ответы»: появляется после первого экрана -->
<template>
  <button
    class="scroll-to-top"
    :class="{ 'scroll-to-top--visible': visible }"
    type="button"
    aria-label="Наверх"
    @click="toTop"
  >
    <svg width="16" height="9" viewBox="0 0 16 9" fill="none" aria-hidden="true">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.19497 0.205025C7.92161 -0.0683417 7.47839 -0.0683417 7.20503 0.205025L0.205025 7.20503C-0.0683417 7.47839 -0.0683418 7.92161 0.205025 8.19497C0.478392 8.46834 0.921608 8.46834 1.19497 8.19497L7.7 1.68995L14.205 8.19498C14.4784 8.46834 14.9216 8.46834 15.195 8.19498C15.4683 7.92161 15.4683 7.47839 15.195 7.20503L8.19497 0.205025Z" fill="#0154C8" />
    </svg>
  </button>
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .12);
  cursor: pointer;
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
