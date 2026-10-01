<!--
  Чат с ИИ-агентом, как помощник в «Битрикс24 Ответы»: белый экран поверх страницы
  (шапка остаётся), приветствие с примерами, вопрос — серым пузырём справа, ответ —
  текстом с кнопками «копировать / нравится / не нравится», внизу поле как на главной.
  Ответы стримятся с /api/assistant (BitrixGPT через AI Router). История — в localStorage.
-->
<template>
  <div class="hd-chat-overlay" :class="{ 'is-open': open }" role="dialog" aria-modal="true" aria-label="Чат с ИИ-агентом">
    <div class="hd-chat">
      <button class="hd-chat-close" type="button" aria-label="Закрыть" title="Закрыть" @click="$emit('close')">
        <HdIcon name="close" />
      </button>

      <div ref="scroller" class="hd-chat-messages">
        <div class="hd-chat-welcome">
          <h2 class="hd-chat-welcome-title"><span aria-hidden="true">👋</span> Привет! Я — ваш личный помощник.</h2>
          <p>Я помогу найти ответы по навыкам ИИ-агентов и модулям shef.*.<br>Напишите вопрос так же, как спросили бы человека.<br>Например:</p>
          <ul>
            <li v-for="q in examples" :key="q"><button type="button" @click="send(q)">«{{ q }}»</button></li>
          </ul>
        </div>

        <!-- Сообщения — B24ChatMessages (Bitrix24 UI) по образцу nuxt-ui-templates/chat:
             части ответа — рассуждение (ChatReasoning), подобранные страницы (ChatTool), текст (MDC) -->
        <B24ChatMessages
          v-if="chatMessages.length"
          :messages="chatMessages"
          :status="chat.status"
          should-auto-scroll
          :auto-scroll="false"
          :user="{ side: 'right', variant: 'message' }"
          :assistant="{ side: 'left', variant: 'message' }"
          class="hd-chat-list"
        >
          <template #indicator>
            <span class="hd-chat-search"><HdStar class="hd-chat-search-star" /><B24ChatShimmer :text="`Ищу ответ среди ${articlesCount} статей`" /></span>
          </template>

          <template #content="{ message }">
            <template v-for="(part, index) in message.parts" :key="`${message.id}-${index}`">
              <B24ChatTool
                v-if="part.type === 'data-sources' && sourcesOf(part).length"
                :text="`Нашёл страницы: ${sourcesOf(part).length}`"
                chevron="leading"
                class="hd-chat-tool"
              >
                <ul class="hd-chat-sources">
                  <li v-for="src in sourcesOf(part)" :key="src.url">
                    <NuxtLink :to="localPath(src.url)" @click="$emit('close')">{{ src.title }}</NuxtLink>
                  </li>
                </ul>
              </B24ChatTool>
              <B24ChatReasoning
                v-else-if="part.type === 'reasoning'"
                :text="(part as { text: string }).text"
                :streaming="isPartStreaming(part)"
                chevron="leading"
                class="hd-chat-reasoning"
              />
              <template v-else-if="part.type === 'text'">
                <MDC v-if="message.role === 'assistant'" :value="(part as { text: string }).text" tag="div" class="hd-chat-md" />
                <span v-else class="hd-chat-own-text">{{ (part as { text: string }).text }}</span>
              </template>
            </template>
          </template>

          <template #actions="{ message }">
            <div v-if="message.role === 'assistant' && textOf(message) && !(busy && message.id === chatMessages[chatMessages.length - 1]?.id)" class="hd-chat-tools">
              <button type="button" :title="copiedId === message.id ? 'Скопировано' : 'Копировать'" @click="copy(message)">
                <HdIcon :name="copiedId === message.id ? 'check' : 'copy'" />
              </button>
              <button type="button" title="Полезно" :class="{ 'is-on': votes[message.id] === 1 }" @click="vote(message.id, 1)"><HdIcon name="like" /></button>
              <button type="button" title="Не помогло" :class="{ 'is-on': votes[message.id] === -1 }" @click="vote(message.id, -1)"><HdIcon name="dislike" /></button>
            </div>
          </template>
        </B24ChatMessages>

        <div v-if="error" class="hd-chat-answer">
          <p class="hd-chat-error">Не удалось выполнить запрос.</p>
          <NuxtLink :to="{ path: '/search', query: { q: lastQuestion } }" class="hd-chat-fallback" @click="$emit('close')">🔎 Попробуйте найти ответ через поиск по ключевым словам</NuxtLink>
        </div>
      </div>

      <form class="hd-chat-form" @submit.prevent="submit">
        <div class="hd-chat-row">
          <textarea
            ref="input"
            v-model="draft"
            class="hd-chat-input"
            rows="1"
            aria-label="Текст вопроса"
            @keydown.enter.exact.prevent="submit"
          />
          <button v-if="busy" class="hd-chat-send is-stop" type="button" aria-label="Остановить" @click="stopChat()"><i /></button>
          <button v-else class="hd-chat-send" type="submit" aria-label="Отправить" :disabled="!draft.trim()">
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.5 2.3c0-.6.7-1 1.2-.7l9 5.7c.5.3.5 1 0 1.4l-9 5.7c-.5.3-1.2-.1-1.2-.7V2.3Z" /></svg>
          </button>
        </div>
        <p class="hd-chat-disclaimer">
          Ответы BitrixGPT могут быть неточны, проверяйте важную информацию.
          <NuxtLink to="/methodology/method" @click="$emit('close')">Подробнее</NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import { Chat } from '@ai-sdk/vue'
import { useLocalStorage } from '@vueuse/core'
import { isPartStreaming } from '@bitrix24/b24ui-nuxt/utils/ai'

const props = defineProps({ open: { type: Boolean, default: false } })
defineEmits(['close'])

const { ask } = useHdChat()

const examples = ['Как написать навык для своего модуля?', 'Почему ИИ-агент не берёт мой навык?']
const stored = useLocalStorage<UIMessage[]>('assistant-messages', [])
const votes = useLocalStorage<Record<string, number>>('assistant-votes', {})

const chat = new Chat({
  messages: stored.value,
  transport: new DefaultChatTransport({ api: '/api/assistant' }),
  onFinish: () => { stored.value = [...chat.messages] },
})
const chatMessages = computed(() => chat.messages)
const busy = computed(() => chat.status === 'streaming' || chat.status === 'submitted')
const error = computed(() => chat.error)

// «Ищу ответ среди N статей» — сколько страниц документации на сайте
const navigation = inject<Ref<Array<{ children?: unknown[] }>>>('navigation', ref([]))
const countPages = (items: Array<{ children?: unknown[] }>): number =>
  items.reduce((n, i) => n + (i.children?.length ? countPages(i.children as Array<{ children?: unknown[] }>) : 1), 0)
const articlesCount = computed(() => countPages(navigation.value || []))

const draft = ref('')
const input = ref<HTMLTextAreaElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
const copiedId = ref('')

type Source = { title: string, url: string }
const sourcesOf = (part: unknown) => ((part as { data?: Source[] }).data || [])
// Ссылки из llms-full.txt абсолютные (https://skills-site…/путь) — внутри сайта переходим без перезагрузки
const localPath = (url: string) => { try { return new URL(url).pathname } catch { return url } }

// Последний вопрос — для ссылки «поиск по ключевым словам», когда ИИ не ответил
const lastQuestion = computed(() => { const m = [...chatMessages.value].reverse().find(x => x.role === 'user'); return m ? textOf(m) : '' })

const textOf = (m: UIMessage) => m.parts.filter(p => p.type === 'text').map(p => (p as { text: string }).text).join('')

function send(text: string) {
  const q = text.trim()
  if (!q || busy.value) return
  chat.sendMessage({ text: q })
  draft.value = ''
}
function submit() { send(draft.value) }
function stopChat() { chat.stop() }
function clear() { chat.messages = []; stored.value = [] }
function vote(id: string, v: number) { votes.value = { ...votes.value, [id]: votes.value[id] === v ? 0 : v } }
async function copy(m: UIMessage) {
  try {
    await navigator.clipboard.writeText(textOf(m))
    copiedId.value = m.id
    setTimeout(() => { copiedId.value = '' }, 1500)
  } catch { /* буфер недоступен во фрейме без разрешения */ }
}

// Вопрос из поиска: пришёл вместе с открытием — отправляем сразу
watch(() => [props.open, ask.value] as const, ([open, q]) => {
  if (open && q) { send(q); ask.value = '' }
  if (open) nextTick(() => input.value?.focus({ preventScroll: true }))
}, { immediate: true })

watch(() => chatMessages.value.map(m => textOf(m).length).join() + String(!!error.value), () => {
  nextTick(() => { if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight })
})
</script>

<style scoped>
.hd-chat {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 840px;
  margin: 0 auto;
  padding: 24px 60px 24px;
}

.hd-chat-close {
  position: absolute;
  top: 24px;
  right: 24px;
  display: inline-flex;
  padding: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #a8adb4;
  font-size: 22px;
  cursor: pointer;
}
.hd-chat-close:hover { color: #333; background: var(--hd-hover-bg); }

.hd-chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 0 0 24px;
  overscroll-behavior: contain;
  font-size: 17px;
  line-height: 24px;
  color: #333;
}

.hd-chat-welcome-title { margin: 0 0 20px; font-size: 21px; line-height: 29px; font-weight: 600; color: #333; }
.hd-chat-welcome p { margin: 0; }
.hd-chat-welcome ul { margin: 4px 0 0; padding-left: 20px; }
.hd-chat-welcome li::marker { color: var(--hd-primary); }
.hd-chat-welcome li button { padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-align: left; }
.hd-chat-welcome li button:hover { color: var(--hd-link); }

/* B24ChatMessages: вопрос — серым пузырём справа, ответ — без пузыря, как у помощника оригинала */
.hd-chat-list { gap: 28px; }
.hd-chat-list :deep([data-role="user"] [data-slot="content"]) {
  padding: 12px 16px;
  border-radius: 20px;
  background: #f1f3f5;
  color: #333;
  font-size: 17px;
  line-height: 24px;
}
.hd-chat-list :deep([data-role="assistant"] [data-slot="content"]) {
  padding: 0;
  background: transparent;
  color: #333;
  font-size: 17px;
  line-height: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
/* действия под ответом видны всегда, не только по наведению */
.hd-chat-list :deep([data-role="assistant"] [data-slot="actions"]) { opacity: 1; visibility: visible; }
.hd-chat-own-text { white-space: pre-wrap; word-break: break-word; }
.hd-chat-tool, .hd-chat-reasoning { font-size: 14px; color: var(--hd-text-tertiary); }
.hd-chat-sources { margin: 6px 0 0; padding-left: 20px; list-style: disc; font-size: 15px; line-height: 22px; }
.hd-chat-sources li::marker { color: var(--hd-primary); }
.hd-chat-sources a { color: var(--hd-link); text-decoration: none; }
.hd-chat-sources a:hover { text-decoration: underline; }
.hd-chat-answer { display: flex; flex-direction: column; gap: 14px; }
.hd-chat-error { margin: 0; }
.hd-chat-fallback { color: var(--hd-link); text-decoration: none; }
.hd-chat-fallback:hover { text-decoration: underline; }

.hd-chat-tools { display: flex; gap: 8px; }
.hd-chat-tools button {
  display: inline-flex;
  padding: 4px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #828b95;
  font-size: 20px;
  cursor: pointer;
}
.hd-chat-tools button:hover { color: #333; background: var(--hd-hover-bg); }
.hd-chat-tools button.is-on { color: var(--hd-primary); }

.hd-chat-search { display: inline-flex; align-items: center; gap: 14px; font-size: 16px; font-weight: 500; color: #333; }
.hd-chat-search-star { width: 34px; height: 34px; animation: hd-pulse 1.4s ease-in-out infinite; }
@keyframes hd-pulse { 0%, 100% { transform: scale(1); opacity: .85; } 50% { transform: scale(1.12); opacity: 1; } }

.hd-chat-md :deep(p) { margin: 0 0 .7em; }
.hd-chat-md :deep(p:last-child) { margin-bottom: 0; }
.hd-chat-md :deep(ul), .hd-chat-md :deep(ol) { margin: 0 0 .7em; padding-left: 1.3em; list-style: revert; }
.hd-chat-md :deep(li) { padding: 2px 0; }
.hd-chat-md :deep(a) { color: var(--hd-link); text-decoration: none; }
.hd-chat-md :deep(a:hover) { text-decoration: underline; }
.hd-chat-md :deep(strong) { font-weight: 600; }
.hd-chat-md :deep(code) { font: 14px/1.4 var(--hd-font-mono); background: #f1f3f5; border-radius: 6px; padding: 1px 5px; }
.hd-chat-md :deep(pre) { margin: 0 0 .7em; padding: 12px; overflow-x: auto; background: #f6fafb; border: 1px solid var(--hd-border); border-radius: 12px; }
.hd-chat-md :deep(pre code) { background: none; padding: 0; }
.hd-chat-md :deep(table) { border-collapse: collapse; margin: 0 0 .7em; font-size: 15px; }
.hd-chat-md :deep(td), .hd-chat-md :deep(th) { border: 1px solid var(--hd-border-button); padding: 4px 8px; }

/* Поле внизу — как у помощника оригинала: поле, справа круглая кнопка, под ними — оговорка */
.hd-chat-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 12px 6px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, .1);
}
.hd-chat-row { display: flex; align-items: center; gap: 12px; }
.hd-chat-input {
  flex: 1 1 auto;
  min-height: 44px;
  max-height: 160px;
  padding: 11px 12px;
  border: 1px solid #c4e6ff;
  border-radius: 12px;
  background: #f6fafb;
  color: #333;
  font: inherit;
  font-size: 16px;
  line-height: 21px;
  resize: none;
  outline: none;
}
.hd-chat-input:focus { border-color: var(--hd-primary); }
.hd-chat-disclaimer { margin: 0; text-align: center; font-size: 12px; line-height: 15px; font-style: italic; color: var(--hd-text-tertiary); }
.hd-chat-disclaimer a { color: var(--hd-text-tertiary); text-decoration: underline; }
.hd-chat-disclaimer a:hover { color: #333; }
.hd-chat-send {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: var(--hd-primary);
  color: #fff;
  cursor: pointer;
}
.hd-chat-send svg { width: 16px; height: 16px; }
.hd-chat-send:disabled { background: #89beff; cursor: default; }
.hd-chat-send:not(:disabled):hover { background: #0060d6; }
.hd-chat-send.is-stop i { width: 12px; height: 12px; border-radius: 2px; background: #fff; }

@media (max-width: 767px) {
  .hd-chat { padding: 16px; }
  .hd-chat-close { top: 12px; right: 12px; }
}
</style>
