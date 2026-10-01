import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

/**
 * Чат по контенту сайта. Провайдер — любой OpenAI-совместимый endpoint;
 * по умолчанию BitrixGPT через AI Router Вайбкода (ключ BXSHEF_EVAL_KEY).
 *
 * Из /llms-full.txt (все страницы сайта) выбираются страницы, ближайшие к вопросу по словам,
 * и кладутся в системный промпт (до ~60 КБ). Любая модель, без инструментов.
 */
type Page = { title: string, url: string, text: string, words: Set<string> }
let cache: { at: number, pages: Page[] } | null = null
const CONTEXT_LIMIT = 60_000

const tokens = (s: string) => new Set((s.toLowerCase().match(/[a-zа-яё0-9_.\-]{4,}/g) || []))

async function pages(event: Parameters<typeof defineEventHandler>[0] extends (e: infer E) => unknown ? E : never): Promise<Page[]> {
  if (cache && Date.now() - cache.at < 10 * 60_000) return cache.pages
  // Полный адрес, а не event.fetch: в dev файлы public/ отдаёт Vite, а не Nitro
  const text = await fetch(new URL('/llms-full.txt', getRequestURL(event).origin)).then(r => r.ok ? r.text() : '').catch(() => '')
  const list = text.split(/\n\n---\n\n(?=# )/).slice(1).map((chunk) => {
    const title = (chunk.match(/^# (.+)$/m) || [])[1] || ''
    const url = (chunk.match(/^URL: (\S+)$/m) || [])[1] || ''
    return { title, url, text: chunk, words: tokens(chunk) }
  })
  if (list.length) cache = { at: Date.now(), pages: list } // пустой ответ не кэшируем
  return list
}

function pick(all: Page[], question: string): Page[] {
  const q = tokens(question)
  const scored = all.map(p => ({ p, s: [...q].reduce((n, w) => n + (p.words.has(w) ? 1 : 0), 0) + (q.size && [...q].some(w => p.title.toLowerCase().includes(w)) ? 3 : 0) }))
    .sort((a, b) => b.s - a.s)
  const out: Page[] = []
  let size = 0
  for (const { p, s } of scored) {
    if (s === 0 && out.length) break
    if (size + p.text.length > CONTEXT_LIMIT) continue
    out.push(p); size += p.text.length
    if (out.length >= 8) break
  }
  return out
}

export default defineEventHandler(async (event) => {
  const { messages } = await readBody(event)
  // runtimeConfig фиксируется при сборке; в Docker переменные приходят при запуске — читаем их первыми
  const rc = useRuntimeConfig().ai
  const ai = {
    url: process.env.BXSHEF_EVAL_URL || rc.url,
    key: process.env.BXSHEF_EVAL_KEY || rc.key,
    model: process.env.BXSHEF_CHAT_MODEL || rc.model,
  }
  if (!ai.key) throw createError({ statusCode: 503, message: 'BXSHEF_EVAL_KEY не задан — чат выключен' })

  const provider = createOpenAICompatible({ name: 'router', baseURL: ai.url, apiKey: ai.key })
  const modelMessages = await convertToModelMessages(messages)

  const last = [...messages].reverse().find((m: any) => m.role === 'user')
  const question = (last?.parts || []).filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ') || ''
  const chosen = pick(await pages(event), question)

  const instructions = [
    'Ты — помощник по сайту skills-site.bx-shef.by: методология и проверка навыков ИИ-агентов для Битрикса, навыки к модулям shef.*.',
    'Отвечай по-русски, коротко, с точными именами команд, файлов и правил из документации ниже. Заголовки markdown не используй; выделяй жирным.',
    'Давай ссылки на страницы вида [название](URL) — URL бери из строк «URL:» ниже. Если ответа в документации нет — так и скажи и отправь на GitHub bx-shef.',
    '',
    '=== СТРАНИЦЫ САЙТА, ПОДОБРАННЫЕ ПОД ВОПРОС ===',
    ...chosen.map(p => p.text),
  ].join('\n')

  // Сначала — какие страницы подобраны (в чате это шаг «Нашёл страницы»), потом ответ модели вместе с рассуждением
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'data-sources', data: chosen.map(p => ({ title: p.title, url: p.url })) })
      writer.merge(streamText({ system: instructions, model: provider(ai.model), messages: modelMessages }).toUIMessageStream({ sendReasoning: true }))
    },
  })
  return createUIMessageStreamResponse({ stream })
})
