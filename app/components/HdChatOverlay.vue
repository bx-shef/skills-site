<!--
  Чат с ИИ-агентом, как помощник в «Битрикс24 Ответы», панелью справа (как «Ask AI» в Docus), приветствие с примерами, вопрос — серым пузырём справа, ответ —
  текстом с кнопками «копировать / нравится / не нравится», внизу поле как на главной.
  Ответы стримятся с /api/assistant (модель — из окружения, см. server/utils/chat-config.ts). История — в localStorage.
-->
<template>
  <div class="hd-chat-overlay" :class="{ 'is-open': open }" role="complementary" aria-label="Чат с ИИ-агентом">
    <div class="hd-chat-bar">
      <span class="hd-chat-bar-title">ИИ-помощник</span>
      <button v-if="chatMessages.length" class="hd-header-icon" type="button" title="Очистить чат" aria-label="Очистить чат" @click="clear">
        <HdIcon name="clear" />
      </button>
      <button class="hd-header-icon" type="button" title="Свернуть" aria-label="Свернуть панель" @click="$emit('close')">
        <HdIcon name="panel-close" />
      </button>
    </div>
    <div class="hd-chat">

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
                :text="sourcesOf(part).length === 1 ? `Изучаю страницу: ${sourcesOf(part)[0]?.title}` : `Нашёл страницы: ${sourcesOf(part).length}`"
                chevron="leading"
                class="hd-chat-tool"
              >
                <ul class="hd-chat-sources">
                  <li v-for="src in sourcesOf(part)" :key="src.url">
                    <NuxtLink :to="localPath(src.url)">{{ src.title }}</NuxtLink>
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
            <!-- Между подобранными страницами и первым словом модели — не пустота, а «Думаю…» -->
            <span v-if="waitingFor === message.id" class="hd-chat-search"><HdStar class="hd-chat-search-star" /><B24ChatShimmer text="Думаю…" /></span>
            <p v-if="(message.metadata as { finishReason?: string } | undefined)?.finishReason === 'length'" class="hd-chat-cut">
              Ответ обрезан: модель упёрлась в лимит длины. Задайте вопрос уже или попросите продолжить.
            </p>
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

        <div v-if="(error || timedOut) && !busy" class="hd-chat-answer">
          <p class="hd-chat-error">{{ timedOut ? 'Модель не ответила за 30 секунд.' : 'Не удалось выполнить запрос.' }}</p>
          <button type="button" class="hd-chat-fallback" @click="retry">↻ Повторить</button>
          <NuxtLink :to="{ path: '/search', query: { q: lastQuestion } }" class="hd-chat-fallback" @click="$emit('close')">🔎 Попробуйте найти ответ через поиск по ключевым словам</NuxtLink>
        </div>
      </div>

      <form class="hd-chat-form" @submit.prevent="submit">
        <!-- Тема разговора после «Обсудить с ИИ»: страница идёт в контекст первой; ✕ — обычный поиск по сайту -->
        <div v-if="page" class="hd-chat-topic">
          <span>Обсуждаем: <NuxtLink :to="page.path">{{ page.title }}</NuxtLink></span>
          <button type="button" class="hd-chat-topic-close" title="Не обсуждать страницу" aria-label="Не обсуждать страницу" @click="page = null"><HdIcon name="close" /></button>
        </div>
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
          Ответы {{ modelName }} могут быть неточны, проверяйте важную информацию.
          <NuxtLink to="/ai-answers">Подробнее</NuxtLink>
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

const { ask, page, open: chatOpenState } = useHdChat()
const modelName = useChatModel()
// Пользователь вернулся, а чат был открыт — открываем снова (на телефоне не навязываем: там он на весь экран)
onMounted(() => {
  try { if (localStorage.getItem('hd-chat-open') === '1' && window.innerWidth >= 768) chatOpenState.value = true } catch { /* приватный режим */ }
})

const examples = ['Как написать навык для своего модуля?', 'Почему ИИ-агент не берёт мой навык?']
const stored = useLocalStorage<UIMessage[]>('assistant-messages', [])
const votes = useLocalStorage<Record<string, number>>('assistant-votes', {})

const chat = new Chat({
  messages: stored.value,
  // page — обсуждаемая статья: сервер кладёт её в контекст первой
  transport: new DefaultChatTransport({ api: '/api/assistant', body: () => ({ page: page.value?.path }) }),
  onFinish: () => { stored.value = [...chat.messages] },
})
const chatMessages = computed(() => chat.messages)
const busy = computed(() => chat.status === 'streaming' || chat.status === 'submitted')
const error = computed(() => chat.error)

// Ответ начался (статус streaming), но ни рассуждений, ни текста ещё нет — id этого ответа.
// Пока так, под ним крутится «Думаю…»: штатный индикатор гаснет уже на первой части потока.
const waitingFor = computed(() => {
  if (chat.status !== 'streaming') return ''
  const last = chatMessages.value[chatMessages.value.length - 1]
  if (!last || last.role !== 'assistant') return ''
  return last.parts.some(p => p.type === 'reasoning' || p.type === 'text') ? '' : last.id
})
// Модель молчит дольше FIRST_TOKEN_TIMEOUT — останавливаем: дальше сработает показ ошибки и «Повторить»
const FIRST_TOKEN_TIMEOUT = 30_000
const timedOut = ref(false)
let firstTokenTimer: ReturnType<typeof setTimeout> | undefined
watch(() => chat.status === 'submitted' || !!waitingFor.value, (waiting) => {
  clearTimeout(firstTokenTimer)
  if (waiting) firstTokenTimer = setTimeout(() => { timedOut.value = true; chat.stop() }, FIRST_TOKEN_TIMEOUT)
})
onBeforeUnmount(() => clearTimeout(firstTokenTimer))

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
  timedOut.value = false
  chat.sendMessage({ text: q })
  draft.value = ''
}
function submit() { send(draft.value) }
function retry() { timedOut.value = false; chat.regenerate() }
function stopChat() { chat.stop() }
function clear() { chat.messages = []; stored.value = []; page.value = null }
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
.hd-chat-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--hd-header-height);
  padding: 0 16px 0 24px;
  border-bottom: 1px solid var(--hd-line);
}
.hd-chat-bar-title { flex: 1; font-size: 16px; font-weight: 600; color: var(--hd-text-heading); }

.hd-chat {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100% - var(--hd-header-height));
  padding: 24px 24px 20px;
}


.hd-chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 0 0 24px;
  overflow-x: hidden;
  scrollbar-width: none;
  overscroll-behavior: contain;
  font-size: 15px;
  line-height: 22px;
  color: var(--hd-text-primary);
}

.hd-chat-welcome-title { margin: 0 0 14px; padding-right: 32px; font-size: 18px; line-height: 25px; font-weight: 600; color: var(--hd-text-primary); }
.hd-chat-welcome p { margin: 0; }
.hd-chat-welcome ul { margin: 4px 0 0; padding-left: 20px; }
.hd-chat-welcome li::marker { color: var(--hd-primary); }
.hd-chat-welcome li button { padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-align: left; }
.hd-chat-welcome li button:hover { color: var(--hd-link); }

/* B24ChatMessages: вопрос — серым пузырём справа, ответ — без пузыря, как у помощника оригинала */
.hd-chat-messages::-webkit-scrollbar { display: none; }
.hd-chat-list { gap: 28px; min-width: 0; max-width: 100%; }
/* узкая панель: сообщения не шире её, длинный код переносится внутри блока */
.hd-chat-list :deep(article), .hd-chat-list :deep([data-slot="container"]), .hd-chat-list :deep([data-slot="body"]) { min-width: 0; max-width: 100%; }
.hd-chat-list :deep([data-role="user"] [data-slot="container"]) { max-width: 85%; margin-left: auto; }
.hd-chat-list :deep([data-role="user"] [data-slot="content"]) {
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--hd-soft);
  color: var(--hd-text-primary);
  font-size: 15px;
  line-height: 22px;
}
.hd-chat-list :deep([data-role="assistant"] [data-slot="content"]) {
  padding: 0;
  background: transparent;
  color: var(--hd-text-primary);
  font-size: 15px;
  line-height: 22px;
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
.hd-chat-fallback { color: var(--hd-link); text-decoration: none; background: none; border: 0; padding: 0; font: inherit; text-align: left; cursor: pointer; }
button.hd-chat-fallback { display: block; margin: 0 0 8px; }
.hd-chat-fallback:hover { text-decoration: underline; }

.hd-chat-tools { display: flex; gap: 8px; }
.hd-chat-topic { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 8px; font-size: 13px; color: var(--hd-text-tertiary); }
.hd-chat-topic span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hd-chat-topic a { color: var(--hd-link); text-decoration: none; }
.hd-chat-topic-close { display: inline-flex; padding: 2px; border: 0; background: none; color: var(--hd-text-tertiary); cursor: pointer; }
.hd-chat-topic-close .hd-icon { width: 14px; height: 14px; }
.hd-chat-cut { margin: 8px 0 0; font-size: 13px; color: var(--hd-text-tertiary); }
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
.hd-chat-tools button:hover { color: var(--hd-text-primary); background: var(--hd-hover-bg); }
.hd-chat-tools button.is-on { color: var(--hd-primary); }

.hd-chat-search { display: inline-flex; align-items: center; gap: 14px; font-size: 16px; font-weight: 500; color: var(--hd-text-primary); }
.hd-chat-search-star { width: 34px; height: 34px; animation: hd-pulse 1.4s ease-in-out infinite; }
@keyframes hd-pulse { 0%, 100% { transform: scale(1); opacity: .85; } 50% { transform: scale(1.12); opacity: 1; } }

.hd-chat-md :deep(p) { margin: 0 0 .7em; }
.hd-chat-md :deep(p:last-child) { margin-bottom: 0; }
.hd-chat-md :deep(ul), .hd-chat-md :deep(ol) { margin: 0 0 .7em; padding-left: 1.3em; list-style: revert; }
.hd-chat-md :deep(li) { padding: 2px 0; }
.hd-chat-md :deep(:not(pre) > code) { overflow-wrap: anywhere; }
.hd-chat-md :deep(a) { color: var(--hd-link); text-decoration: none; }
.hd-chat-md :deep(a:hover) { text-decoration: underline; }
.hd-chat-md :deep(strong) { font-weight: 600; }
.hd-chat-md :deep(:not(pre) > code) { overflow-wrap: anywhere; }
.hd-chat-md :deep(code) { font: 14px/1.4 var(--hd-font-mono); background: var(--hd-soft); border-radius: 6px; padding: 1px 5px; }
.hd-chat-md :deep(pre) { margin: 0 0 .7em; padding: 12px; overflow-x: auto; background: var(--hd-input-bg); border: 1px solid var(--hd-border); border-radius: 12px; }
.hd-chat-md :deep(pre code) { background: none; padding: 0; }
.hd-chat-md :deep(table) { border-collapse: collapse; margin: 0 0 .7em; font-size: 15px; }
.hd-chat-md :deep(td), .hd-chat-md :deep(th) { border: 1px solid var(--hd-border-button); padding: 4px 8px; }

/* Поле внизу — как у помощника оригинала: поле, справа круглая кнопка, под ними — оговорка */
.hd-chat-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 12px 6px;
  border-radius: 12px;
  background: var(--hd-bg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, .1);
}
.hd-chat-row { display: flex; align-items: center; gap: 12px; }
.hd-chat-input {
  flex: 1 1 auto;
  min-height: 44px;
  max-height: 160px;
  padding: 11px 12px;
  border: 1px solid var(--hd-input-border);
  border-radius: 8px;
  scrollbar-width: none;
  background: var(--hd-input-bg);
  color: var(--hd-text-primary);
  font: inherit;
  font-size: 16px;
  line-height: 21px;
  resize: none;
  outline: none;
}
.hd-chat-input:focus { border-color: var(--hd-primary); }
.hd-chat-disclaimer { margin: 0; text-align: center; font-size: 12px; line-height: 15px; font-style: italic; color: var(--hd-text-tertiary); }
.hd-chat-disclaimer a { color: var(--hd-text-tertiary); text-decoration: underline; }
.hd-chat-disclaimer a:hover { color: var(--hd-text-primary); }
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
.hd-chat-send.is-stop i { width: 12px; height: 12px; border-radius: 2px; background: var(--hd-bg); }

@media (max-width: 767px) {
  .hd-chat { padding: 20px 20px 16px; }
  .hd-chat-bar { padding: 0 12px 0 20px; }
}
</style>
