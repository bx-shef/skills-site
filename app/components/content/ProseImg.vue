<!--
  Картинка в статье: с тенью; по клику открывается
  большой на затемнённом фоне, закрывается кликом или Esc.
-->
<template>
  <!-- бейджи (svg, shields) — как есть: без тени и увеличения -->
  <img v-if="badge" :src="src" :alt="alt" :width="width" :height="height" class="hd-badge">
  <img v-else :src="src" :alt="alt" :width="width" :height="height" class="hd-img" loading="lazy" @click="open = true">
  <Teleport v-if="!badge" to="body">
    <div v-if="open" class="hd-lightbox" role="dialog" aria-modal="true" :aria-label="alt || 'Изображение'" @click="open = false">
      <img :src="src" :alt="alt">
      <button type="button" class="hd-lightbox-close" aria-label="Закрыть"><HdIcon name="close" /></button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ src?: string, alt?: string, width?: string | number, height?: string | number }>()
const badge = computed(() => /\.svg(\?|$)|badge|shields\.io/i.test(props.src || ''))
const open = ref(false)
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }
watch(open, (v) => {
  document.documentElement.style.overflow = v ? 'hidden' : ''
  if (v) window.addEventListener('keydown', onKey)
  else window.removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); document.documentElement.style.overflow = '' })
</script>

<style scoped>
.hd-img {
  max-width: 100%;
  height: auto;
  margin: 8px 0 16px;
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, .19), 0 6px 6px rgba(0, 0, 0, .23);
  cursor: zoom-in;
}
.hd-badge { display: inline; vertical-align: middle; }
.hd-lightbox {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(0, 0, 0, .75);
  cursor: zoom-out;
  animation: hd-fade .15s ease;
}
.hd-lightbox img { max-width: 100%; max-height: 100%; border-radius: 10px; box-shadow: 0 20px 60px rgba(0, 0, 0, .5); }
.hd-lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  padding: 6px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, .15);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
}
@keyframes hd-fade { from { opacity: 0; } to { opacity: 1; } }
</style>
