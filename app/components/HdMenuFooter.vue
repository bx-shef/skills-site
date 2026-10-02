<!-- Низ левого меню: «Поддержка» (чат с ИИ-агентом) и кнопка свернуть / развернуть меню -->
<template>
  <div class="hd-menu-footer" :class="{ 'hd-menu-footer--collapsed': collapsed }">
    <B24NavigationMenu
      orientation="vertical"
      :collapsed="collapsed"
      tooltip
      :items="[{ label: 'Поддержка', icon: icon('help'), onSelect: () => openChat() }]"
      class="hd-menu-footer-nav"
    />
    <B24DashboardSidebarCollapse :title="collapsed ? 'Развернуть меню' : 'Свернуть меню'" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ collapsed?: boolean }>()
const { openChat } = useHdChat()
</script>

<style scoped>
.hd-menu-footer { display: flex; align-items: center; gap: 4px; width: 100%; }
.hd-menu-footer-nav { flex: 1 1 auto; min-width: 0; }
.hd-menu-footer--collapsed { flex-direction: column; }
</style>
