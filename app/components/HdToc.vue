<!--
  Оглавление статьи справа. Показывается с 1280px — см. layout.css: на узком
  экране ему не хватает места рядом с текстом 875px и меню 84px.
-->
<template>
  <aside class="hd-toc" aria-label="Оглавление статьи">
    <p class="hd-toc-title">Содержание</p>
    <ul class="hd-toc-list">
      <li v-for="link in links" :key="link.id" :class="`hd-toc-depth-${link.depth}`">
        <a :href="`#${link.id}`" class="hd-toc-link">{{ link.text }}</a>
      </li>
    </ul>
  </aside>
</template>

<script setup>
// В Docus оглавление приходит готовым — page.body.toc.links
defineProps({
  links: {
    type: Array,
    default: () => [
      { id: 'about', text: 'О чём статья', depth: 2 },
      { id: 'how',   text: 'Как сделать',  depth: 2 },
    ],
  },
})
</script>

<style scoped>
.hd-toc-title {
  margin: 0 0 var(--hd-space-md);
  font-size: var(--hd-size-sm);
  font-weight: 500;
  color: var(--hd-text-tertiary);
}

.hd-toc-list { margin: 0; padding: 0; list-style: none; }

.hd-toc-link {
  display: block;
  padding: var(--hd-space-sm) 0;
  color: var(--hd-text-secondary);
  font-size: var(--hd-size-sm);
  line-height: 1.4;
  text-decoration: none;
}
.hd-toc-link:hover { color: var(--hd-primary); }

.hd-toc-depth-3 { padding-left: var(--hd-space-md); }
</style>
