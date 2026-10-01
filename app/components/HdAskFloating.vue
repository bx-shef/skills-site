<!--
  Плавающее поле «Задать вопрос» внизу страницы, как в Docus: Ctrl+I — фокус,
  Enter — вопрос ИИ-агенту (открывается чат). Пока открыт чат — скрыто.
-->
<template>
  <form v-show="!chatOpen" class="hd-ask-float" @submit.prevent="submit">
    <input
      ref="input"
      v-model="q"
      type="text"
      placeholder="Задать вопрос…"
      aria-label="Задать вопрос ИИ-агенту"
    >
    <kbd>Ctrl</kbd><kbd>I</kbd>
    <button type="submit" :disabled="!q.trim()" aria-label="Отправить">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.5 2.3c0-.6.7-1 1.2-.7l9 5.7c.5.3.5 1 0 1.4l-9 5.7c-.5.3-1.2-.1-1.2-.7V2.3Z" /></svg>
    </button>
  </form>
</template>

<script setup lang="ts">
const { open: chatOpen, openChat } = useHdChat()
const q = ref('')
const input = ref<HTMLInputElement>()

function submit() {
  if (!q.value.trim()) return
  openChat(q.value)
  q.value = ''
}

const onKey = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') { e.preventDefault(); input.value?.focus() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
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
  border: 1px solid var(--hd-line);
  border-radius: 12px;
  background: var(--hd-bg);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, .1);
  transform: translateX(-50%);
}
.hd-ask-float:focus-within { border-color: var(--hd-primary); }
.hd-ask-float input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: 14px; color: var(--hd-text-primary); }
.hd-ask-float input::placeholder { color: var(--hd-text-tertiary); }
.hd-ask-float kbd {
  padding: 1px 5px;
  border: 1px solid var(--hd-line);
  border-radius: 5px;
  background: var(--hd-bg);
  font: 11px/16px var(--hd-font);
  color: var(--hd-text-secondary);
}
.hd-ask-float button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 4px;
  border: 0;
  border-radius: 8px;
  background: var(--hd-primary);
  color: #fff;
  cursor: pointer;
}
.hd-ask-float button:disabled { background: #89beff; cursor: default; }
.hd-ask-float button svg { width: 12px; height: 12px; }
@media (max-width: 767px) { .hd-ask-float kbd { display: none; } }
</style>
