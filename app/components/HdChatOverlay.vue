<!--
  Чат с ИИ-агентом по содержимому сайта: оверлей на весь экран поверх страницы,
  слева остаётся меню (84px) — из чата можно уйти в раздел, не закрывая его.
  Ответы стримятся с /api/assistant (BitrixGPT через AI Router, server/api/assistant.post.ts).
  История держится в localStorage — та же, что у встроенного ассистента Docus.
-->
<template>
  <div class="hd-chat-overlay" :class="{ 'is-open': open }" role="dialog" aria-modal="true" aria-label="Чат с ИИ-агентом">
    <div class="hd-chat">
      <div class="hd-chat-head">
        <div>
          <span class="hd-chat-title">ИИ-агент по сайту</span>
          <span class="hd-chat-sub">отвечает по методологии, навыкам и документации модулей; проверяйте по ссылкам</span>
        </div>
        <div class="hd-chat-actions">
          <button v-if="chatMessages.length" class="hd-btn hd-btn--plain" type="button" @click="clear">Очистить</button>
          <button class="hd-btn hd-btn--plain" type="button" @click="$emit('close')">Закрыть</button>
        </div>
      </div>

      <div ref="scroller" class="hd-chat-messages">
        <template v-if="!chatMessages.length">
          <p class="hd-chat-empty">Спросите, как написать навык, почему ИИ-агент его не берёт или что делает команда <code>bxshef eval</code>.</p>
          <div v-for="group in faqQuestions" :key="group.category" class="hd-chat-faq">
            <p class="hd-chat-faq-title">{{ group.category }}</p>
            <button
              v-for="q in group.items"
              :key="q"
              class="hd-btn hd-btn--outline"
              type="button"
              @click="send(q)"
            >{{ q }}</button>
          </div>
        </template>

        <div
          v-for="msg in chatMessages"
          :key="msg.id"
          class="hd-chat-message"
          :class="{ 'hd-chat-message--own': msg.role === 'user' }"
        >
          <div class="hd-chat-text" :class="{ 'hd-chat-md': msg.role !== 'user' }">
            <template v-if="msg.role === 'user'">{{ textOf(msg) }}</template>
            <MDC v-else-if="textOf(msg)" :value="textOf(msg)" tag="div" />
            <span v-else class="hd-chat-dots" aria-label="Думает">…</span>
          </div>
        </div>
        <p v-if="error" class="hd-chat-error">{{ errorText }}</p>
      </div>

      <form class="hd-chat-form" @submit.prevent="submit">
        <textarea
          ref="input"
          v-model="draft"
          class="hd-chat-input"
          rows="1"
          placeholder="Вопрос по сайту"
          aria-label="Текст вопроса"
          @keydown.enter.exact.prevent="submit"
        />
        <button v-if="busy" class="hd-btn hd-btn--outline" type="button" @click="stop()">Стоп</button>
        <button v-else class="hd-btn hd-btn--primary" type="submit" :disabled="!draft.trim()">Отправить</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/vue'
import { useLocalStorage } from '@vueuse/core'

const props = defineProps({ open: { type: Boolean, default: false } })
defineEmits(['close'])

const config = useRuntimeConfig()
const appConfig = useAppConfig()
const { ask } = useHdChat()

const faqQuestions = computed(() => ((appConfig.assistant as { faqQuestions?: Array<{ category: string, items: string[] }> })?.faqQuestions) || [])
const stored = useLocalStorage<UIMessage[]>('assistant-messages', [])

const { messages: chatMessages, status, error, sendMessage, stop: stopChat } = useChat({
  messages: stored.value,
  transport: new DefaultChatTransport({
    api: (config.app?.baseURL?.replace(/\/$/, '') || '') + ((config.public.assistant as { apiPath?: string })?.apiPath || '/api/assistant'),
  }),
  onFinish: () => { stored.value = [...chatMessages.value] },
})

const busy = computed(() => status.value === 'streaming' || status.value === 'submitted')
const errorText = computed(() => {
  const m = error.value?.message || ''
  try { return m[0] === '{' ? (JSON.parse(m).message || m) : m } catch { return m }
})

const draft = ref('')
const input = ref<HTMLTextAreaElement | null>(null)
const scroller = ref<HTMLElement | null>(null)

const textOf = (m: UIMessage) => m.parts.filter(p => p.type === 'text').map(p => (p as { text: string }).text).join('')

function send(text: string) {
  const q = text.trim()
  if (!q || busy.value) return
  sendMessage({ text: q })
  draft.value = ''
}
function submit() { send(draft.value) }
function stop() { stopChat() }
function clear() { if (busy.value) stopChat(); chatMessages.value = []; stored.value = [] }

// Вопрос из поиска: пришёл вместе с открытием — отправляем сразу
watch(() => [props.open, ask.value] as const, ([open, q]) => {
  if (open && q) { send(q); ask.value = '' }
  if (open) nextTick(() => input.value?.focus({ preventScroll: true }))
}, { immediate: true })

watch(() => chatMessages.value.map(m => textOf(m).length).join(), () => {
  nextTick(() => { if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight })
})
</script>

<style scoped>
.hd-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: var(--hd-space-2xl);
}

.hd-chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--hd-space-md);
  padding-bottom: var(--hd-space-xl);
  border-bottom: 1px solid var(--hd-border);
}
.hd-chat-title { display: block; font-size: var(--hd-size-lg); font-weight: 600; }
.hd-chat-sub { display: block; font-size: 12px; color: var(--hd-text-tertiary); }
.hd-chat-actions { display: flex; gap: var(--hd-space-sm); flex: 0 0 auto; }

.hd-chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--hd-space-2xl) 0;
  display: flex;
  flex-direction: column;
  gap: var(--hd-space-md);
  overscroll-behavior: contain;
}

.hd-chat-empty { margin: 0 0 var(--hd-space-md); color: var(--hd-text-secondary); }
.hd-chat-empty code { font-family: var(--hd-font-mono); background: var(--hd-border); border-radius: var(--hd-radius-sm); padding: 1px 5px; }
.hd-chat-faq { display: flex; flex-wrap: wrap; gap: var(--hd-space-sm); align-items: center; }
.hd-chat-faq-title { width: 100%; margin: var(--hd-space-md) 0 0; font-size: 12px; color: var(--hd-text-tertiary); }
.hd-chat-faq .hd-btn { font-size: 13px; padding: 6px 12px; }

.hd-chat-message { display: flex; }
.hd-chat-message--own { justify-content: flex-end; }

.hd-chat-text {
  margin: 0;
  max-width: 85%;
  padding: var(--hd-space-md) var(--hd-space-xl);
  border-radius: var(--hd-radius-md);
  background: var(--hd-border);
  font-size: var(--hd-size-sm);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.hd-chat-message--own .hd-chat-text { background: var(--hd-hover-bg); }
.hd-chat-md { white-space: normal; }
.hd-chat-md :deep(p) { margin: 0 0 .6em; }
.hd-chat-md :deep(p:last-child) { margin-bottom: 0; }
.hd-chat-md :deep(ul), .hd-chat-md :deep(ol) { margin: 0 0 .6em; padding-left: 1.4em; }
.hd-chat-md :deep(a) { color: var(--hd-primary); }
.hd-chat-md :deep(code) { font-family: var(--hd-font-mono); font-size: 13px; background: var(--hd-bg); border-radius: var(--hd-radius-sm); padding: 1px 5px; }
.hd-chat-md :deep(pre) { margin: 0 0 .6em; padding: var(--hd-space-md); overflow-x: auto; background: var(--hd-bg); border-radius: var(--hd-radius-sm); }
.hd-chat-md :deep(pre code) { background: none; padding: 0; }
.hd-chat-md :deep(h1), .hd-chat-md :deep(h2), .hd-chat-md :deep(h3) { margin: .4em 0; font-size: 15px; font-weight: 600; }
.hd-chat-md :deep(table) { border-collapse: collapse; margin: 0 0 .6em; }
.hd-chat-md :deep(td), .hd-chat-md :deep(th) { border: 1px solid var(--hd-border-button); padding: 4px 8px; }
.hd-chat-dots { color: var(--hd-text-tertiary); }
.hd-chat-error { margin: 0; color: #c0392b; font-size: 13px; }

.hd-chat-form {
  display: flex;
  align-items: flex-end;
  gap: var(--hd-space-md);
  padding-top: var(--hd-space-xl);
  border-top: 1px solid var(--hd-border);
}

.hd-chat-input {
  flex: 1 1 auto;
  min-height: 40px;
  max-height: 160px;
  padding: var(--hd-space-md);
  border: 1px solid var(--hd-border-button);
  border-radius: var(--hd-radius-md);
  background: var(--hd-bg);
  color: var(--hd-text-primary);
  font: inherit;
  font-size: var(--hd-size-sm);
  resize: vertical;
  outline: none;
}
.hd-chat-input:focus { border-color: var(--hd-primary); }
</style>
