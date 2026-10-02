<!--
  Чат с ИИ-агентом панелью справа: приветствие с примерами, вопрос — серым пузырём справа, ответ —
  текстом с кнопками «копировать / нравится / не нравится», внизу поле как на главной.
  Ответы стримятся с /api/assistant (модель — из окружения, см. server/utils/chat-config.ts). История — в localStorage.
-->
<template>
  <div class="hd-chat-overlay" :class="{ 'is-open': open }" role="complementary" aria-label="Чат с ИИ-агентом">
    <div class="hd-chat-bar">
      <span class="hd-chat-bar-title">ИИ-помощник</span>
      <B24Button v-if="chatMessages.length" color="air-tertiary" :icon="icon('clear')" title="Очистить чат" aria-label="Очистить чат" @click="clear" />
      <B24Button color="air-tertiary" :icon="icon('panel-close')" title="Свернуть" aria-label="Свернуть панель" @click="$emit('close')" />
    </div>
    <div class="hd-chat">

      <div ref="scroller" class="hd-chat-messages">
        <div class="hd-chat-welcome">
          <h2 class="hd-chat-welcome-title">ИИ-помощник по сайту</h2>
          <p>Отвечает по методологии, навыкам и документации модулей shef.* со ссылками на страницы. Например:</p>
          <ul>
            <li v-for="q in examples" :key="q"><B24Button color="air-tertiary-accent" size="sm" normal-case :label="`«${q}»`" class="hd-chat-example" @click="send(q)" /></li>
          </ul>
        </div>

        <!-- Сообщения — B24ChatMessages (Bitrix24 UI):
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
              <B24Button color="air-tertiary" size="sm" :icon="icon(copiedId === message.id ? 'check' : 'copy')" :title="copiedId === message.id ? 'Скопировано' : 'Копировать'" :aria-label="copiedId === message.id ? 'Скопировано' : 'Копировать'" @click="copy(message)" />
              <B24Button :color="votes[message.id] === 1 ? 'air-secondary-accent' : 'air-tertiary'" size="sm" :icon="icon('like')" title="Полезно" aria-label="Полезно" :aria-pressed="votes[message.id] === 1" @click="vote(message.id, 1)" />
              <B24Button :color="votes[message.id] === -1 ? 'air-secondary-accent' : 'air-tertiary'" size="sm" :icon="icon('dislike')" :title="ratingsSent ? 'Не помогло — вопрос и ответ уйдут авторам сайта' : 'Не помогло'" aria-label="Не помогло" :aria-pressed="votes[message.id] === -1" @click="vote(message.id, -1)" />
              <span v-if="ratingsSent && votes[message.id] === -1" class="hd-chat-rated">Спасибо: вопрос и ответ переданы авторам сайта</span>
            </div>
          </template>
        </B24ChatMessages>

        <div v-if="(error || timedOut) && !busy" class="hd-chat-answer">
          <p class="hd-chat-error">{{ timedOut ? 'Модель не ответила за 30 секунд.' : 'Не удалось выполнить запрос.' }}</p>
          <B24Button color="air-secondary-accent" size="sm" label="Повторить" class="hd-chat-retry" @click="retry" />
          <NuxtLink :to="{ path: '/search', query: { q: lastQuestion } }" class="hd-chat-fallback" @click="$emit('close')">🔎 Попробуйте найти ответ через поиск по ключевым словам</NuxtLink>
        </div>
      </div>

      <form class="hd-chat-form" @submit.prevent="submit">
        <!-- Тема разговора после «Обсудить с ИИ»: страница идёт в контекст первой; ✕ — обычный поиск по сайту -->
        <div v-if="page" class="hd-chat-topic">
          <span>Обсуждаем: <NuxtLink :to="page.path">{{ page.title }}</NuxtLink></span>
          <B24Button color="air-tertiary" size="xs" :icon="icon('close')" title="Не обсуждать страницу" aria-label="Не обсуждать страницу" @click="page = null" />
        </div>
        <div class="hd-chat-row">
          <B24Textarea
            ref="input"
            v-model="draft"
            class="hd-chat-input"
            :rows="1"
            autoresize
            :maxrows="6"
            aria-label="Текст вопроса"
            @keydown.enter.exact.prevent="submit"
          />
          <B24Button v-if="busy" color="air-primary" rounded :icon="icon('stop')" aria-label="Остановить" @click="stopChat()" />
          <B24Button v-else color="air-primary" rounded type="submit" :icon="icon('send')" aria-label="Отправить" :disabled="!draft.trim()" />
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
const input = ref<{ $el?: HTMLElement } | null>(null)
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
// Оценка ответа: в браузере — всегда (подсветка кнопки), авторам сайта — если на сервере задан
// приёмник отзывов. При «не помогло» с ней уходят вопрос, ответ и подобранные страницы.
const ratingsSent = useChatRatings()
const route = useRoute()
function vote(id: string, v: number) {
  const next = votes.value[id] === v ? 0 : v
  votes.value = { ...votes.value, [id]: next }
  if (!next || !ratingsSent.value) return
  const i = chatMessages.value.findIndex(m => m.id === id)
  const message = chatMessages.value[i]
  if (!message) return
  const question = [...chatMessages.value.slice(0, i)].reverse().find(m => m.role === 'user')
  const sources = message.parts.filter(p => p.type === 'data-sources').flatMap(p => sourcesOf(p).map(s => localPath(s.url)))
  $fetch('/api/assistant-feedback', {
    method: 'POST',
    body: { rating: next, question: question ? textOf(question) : '', answer: textOf(message), sources, page: page.value?.path || route.path },
  }).catch(() => { /* оценка в браузере уже стоит; не сохранилась у авторов — не повод мешать */ })
}
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
  if (open) nextTick(() => input.value?.$el?.querySelector('textarea')?.focus({ preventScroll: true }))
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
.hd-chat-example { white-space: normal; text-align: left; height: auto; }

/* B24ChatMessages: вопрос — серым пузырём справа, ответ — без пузыря */
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
.hd-chat-fallback { display: block; color: var(--hd-link); text-decoration: none; }
.hd-chat-retry { margin: 0 0 8px; }
.hd-chat-fallback:hover { text-decoration: underline; }

.hd-chat-tools { display: flex; align-items: center; gap: 4px; margin-top: 8px; }
.hd-chat-topic { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 8px; font-size: 13px; color: var(--hd-text-tertiary); }
.hd-chat-topic span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hd-chat-topic a { color: var(--hd-link); text-decoration: none; }
.hd-chat-rated { align-self: center; font-size: 12px; color: var(--hd-text-tertiary); }
.hd-chat-cut { margin: 8px 0 0; font-size: 13px; color: var(--hd-text-tertiary); }


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

/* Поле внизу: поле, справа круглая кнопка, под ними — оговорка */
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
.hd-chat-input { flex: 1; min-width: 0; }
.hd-chat-disclaimer { margin: 0; text-align: center; font-size: 12px; line-height: 15px; font-style: italic; color: var(--hd-text-tertiary); }
.hd-chat-disclaimer a { color: var(--hd-text-tertiary); text-decoration: underline; }
.hd-chat-disclaimer a:hover { color: var(--hd-text-primary); }

@media (max-width: 767px) {
  .hd-chat { padding: 20px 20px 16px; }
  .hd-chat-bar { padding: 0 12px 0 20px; }
}
</style>
