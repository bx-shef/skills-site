<!--
  Шапка: логотип, поиск, действия справа.
  Отступ поиска от логотипа растёт с окном, но не больше 161px — формула
  clamp(16px, 8%, 161px) взята из оригинала.
-->
<template>
  <header class="hd-header">
    <button
      class="hd-burger"
      type="button"
      aria-label="Меню"
      @click="$emit('toggle-menu')"
    >☰</button>

    <NuxtLink to="/" class="hd-logo">
      <slot name="logo">{{ title }}</slot>
    </NuxtLink>

    <div class="hd-header-search">
      <HdSearch />
    </div>

    <div class="hd-header-actions">
      <slot name="actions">
        <a class="hd-header-link" href="https://github.com/bx-shef/skills-standard" target="_blank" rel="noopener" title="GitHub">
          <UIcon name="i-simple-icons-github" class="hd-header-svg" />
        </a>
        <HdThemeToggle />
      </slot>
    </div>
  </header>
</template>

<script setup>
defineProps({ title: { type: String, default: 'bxshef' } })
defineEmits(['toggle-menu'])
</script>

<style scoped>
.hd-logo {
  flex: 0 0 auto;
  font-size: var(--hd-size-lg);
  font-weight: 600;
  color: var(--hd-text-primary);
  text-decoration: none;
  white-space: nowrap;
}

/* Кнопка меню нужна только на узком экране: на широком меню всегда видно */
.hd-burger {
  display: none;
  width: 32px;
  height: 32px;
  margin-right: var(--hd-space-md);
  border: 0;
  border-radius: var(--hd-radius-sm);
  background: transparent;
  color: var(--hd-text-secondary);
  font-size: 18px;
  cursor: pointer;
}
.hd-burger:hover { background: var(--hd-hover-bg); }

@media (max-width: 767px) {
  .hd-burger { display: inline-flex; align-items: center; justify-content: center; }
  /* На узком экране поиску нужна вся оставшаяся ширина */
  .hd-header-search { margin-left: var(--hd-space-md); flex: 1 1 auto; }
}

.hd-header-link { display: inline-flex; color: var(--hd-text-secondary); }
.hd-header-link:hover { color: var(--hd-primary); }
.hd-header-svg { width: 20px; height: 20px; }
</style>
