<!--
  Оглавление справа «В этой статье»: серая линия слева, текущий раздел —
  тёмный и с тёмной чертой. Текущий раздел
  отслеживается по прокрутке.
-->
<template>
  <nav class="hd-toc" aria-label="Оглавление статьи">
    <p class="hd-toc-title">В этой статье</p>
    <ul class="hd-toc-list">
      <li v-for="link in flat" :key="link.id" :class="`hd-toc-depth-${link.depth}`">
        <a :href="`#${link.id}`" class="hd-toc-link" :class="{ 'is-active': link.id === active }">{{ link.text }}</a>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
type Link = { id: string, text: string, depth: number, children?: Link[] }
const props = defineProps<{ links: Link[] }>()

// Оглавление Nuxt Content вложенное (h3 внутри h2) — показываем только h2
const flat = computed(() => props.links.filter(l => l.depth <= 2))

const active = ref('')
let observer: IntersectionObserver | undefined
onMounted(() => {
  active.value = flat.value[0]?.id || ''
  observer = new IntersectionObserver((entries) => {
    const top = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
    if (top) active.value = top.target.id
  }, { rootMargin: '-60px 0px -70% 0px' })
  for (const l of flat.value) {
    const el = document.getElementById(l.id)
    if (el) observer.observe(el)
  }
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.hd-toc-title { margin: 0 0 16px; font-size: 15px; line-height: 20px; font-weight: 600; color: var(--hd-text-heading); }
.hd-toc-list { margin: 0; padding: 0; list-style: none; border-left: 1px solid var(--hd-line); }
.hd-toc-link {
  display: block;
  margin-left: -1px;
  padding: 8px 0 8px 14px;
  border-left: 2px solid transparent;
  font-size: 14px;
  line-height: 19px;
  color: var(--hd-text-tertiary);
  text-decoration: none;
  transition: var(--hd-transition);
}
.hd-toc-link:hover { color: var(--hd-text-primary); }
.hd-toc-link.is-active { color: var(--hd-text-primary); border-left-color: var(--hd-text-primary); }
</style>
