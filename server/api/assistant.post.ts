import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

import { buildIndex, select } from '../rag/core.mjs'

/**
 * Чат по контенту сайта. Провайдер — любой OpenAI-совместимый endpoint, модель — одна
 * на установку (server/utils/chat-config.ts: BXSHEF_CHAT_*).
 *
 * Поиск — server/rag: страницы порезаны на разделы (## / ###), BM25 со стеммингом, в промпт идут
 * лучшие разделы (до ~24 КБ) со ссылками вида /путь#якорь. Качество поиска меряет
 * scripts/rag-eval.mjs на evals/chat-retrieval.json. Любая модель, без инструментов.
 */
type Chunk = { title: string, heading: string, url: string, page: string, text: string }
let index: ReturnType<typeof buildIndex> | null = null
const HISTORY = 10 // последних сообщений разговора уходит модели

async function getIndex() {
  if (index) return index
  // server/assets/rag-chunks.json пишет scripts/sync-content.mjs, он едет в сборку.
  // Не fetch к себе по внешнему адресу: за обратным прокси такой запрос может не пройти.
  const raw = await useStorage('assets:server').getItem('rag-chunks.json')
  const chunks = Array.isArray(raw) ? raw : JSON.parse(String(raw || '[]'))
  if (chunks.length) index = buildIndex(chunks) // пустое не кэшируем
  return index
}

// Фрагменты одной страницы — одним блоком: заголовок, «URL:», разделы со своими якорями
function render(chosen: Chunk[]): string {
  const byPage = new Map<string, Chunk[]>()
  for (const c of chosen) byPage.set(c.page, [...(byPage.get(c.page) || []), c])
  return [...byPage.values()].map(list => [
    `# ${list[0]!.title}`,
    `URL: ${list[0]!.page}`,
    ...list.map(c => c.heading ? `## ${c.heading} (${c.url})\n${c.text}` : c.text),
  ].join('\n\n')).join('\n\n---\n\n')
}

export default defineEventHandler(async (event) => {
  const { messages, page } = await readBody(event)
  const ai = chatConfig()
  if (!ai.key) throw createError({ statusCode: 503, message: 'Ключ модели не задан (BXSHEF_CHAT_KEY) — чат выключен' })

  const provider = createOpenAICompatible({ name: 'router', baseURL: ai.url, apiKey: ai.key })
  const modelMessages = await convertToModelMessages(messages.slice(-HISTORY))

  const last = [...messages].reverse().find((m: any) => m.role === 'user')
  const question = (last?.parts || []).filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ') || ''
  const idx = await getIndex()
  if (!idx) {
    console.error('[assistant] поиск не загружен: server/assets/rag-chunks.json пуст или отсутствует')
    throw createError({ statusCode: 503, message: 'Поиск по сайту недоступен' })
  }
  // пересказ — первый вопрос разговора или запрос «Обсудить с ИИ» посреди него (тот же текст, что шлёт discussPage)
  const firstQuestion = messages.filter((m: any) => m.role === 'user').length <= 1 || question.startsWith('Перескажи статью «')
  // «Обсудить с ИИ»: клиент прислал путь статьи. Первый запрос — пересказ, в контексте только она;
  // дальше она остаётся темой (идёт первой), к ней добавляются разделы под новый вопрос
  const path = typeof page === 'string' ? (page.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/') : undefined
  const discussed = path && idx.pages[path] ? path : undefined
  const chosen: Chunk[] = discussed && firstQuestion
    ? idx.docs.filter(d => d.page === discussed)
    : select(idx, question, { page: discussed })
  const sources = [...new Map(chosen.map(c => [c.page, { title: c.title, url: c.page }])).values()]

  console.info(`[assistant] разделов: ${idx.docs.length}, выбрано: ${chosen.map(c => c.url).join(', ') || '—'}`)

  const instructions = [
    'Ты — помощник по сайту skills-site.bx-shef.by: методология и проверка навыков ИИ-агентов для Битрикса, навыки к модулям shef.*.',
    'Отвечай по-русски, коротко, с точными именами команд, файлов и правил из документации ниже. Заголовки markdown не используй; выделяй жирным.',
    'Пересказывай страницу, только если об этом просят в последнем сообщении пользователя: коротко по-русски (5–8 пунктов) и в конце предложи задать вопрос по ней. На любой другой вопрос — отвечай на него, а не пересказывай.',
    'Давай ссылки вида [название](URL) — на страницу из строки «URL:» или на раздел из скобок после его заголовка. Если ответа в документации нет — так и скажи и отправь на GitHub bx-shef.',
    'Не придумывай команды, параметры, файлы, классы и термины, которых нет в документации ниже; общих советов «от себя» не давай.',
    '',
    '=== РАЗДЕЛЫ САЙТА, ПОДОБРАННЫЕ ПОД ВОПРОС ===',
    render(chosen),
  ].join('\n')

  // Сначала — какие страницы подобраны (в чате это шаг «Нашёл страницы»), потом ответ модели вместе с рассуждением
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'data-sources', data: sources })
      writer.merge(streamText({ system: instructions, model: provider(ai.model), messages: modelMessages }).toUIMessageStream({
        sendReasoning: true,
        // причина остановки — клиенту: «length» значит, что ответ обрезан лимитом токенов
        messageMetadata: ({ part }) => part.type === 'finish' ? { finishReason: part.finishReason } : undefined,
      }))
    },
  })
  return createUIMessageStreamResponse({ stream })
})
