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
let cache: { pages: Page[] } | null = null
const CONTEXT_LIMIT = 60_000

const tokens = (s: string) => new Set((s.toLowerCase().match(/[a-zа-яё0-9_.\-]{4,}/g) || []))

async function pages(): Promise<Page[]> {
  if (cache) return cache.pages
  // Копия llms-full.txt в server/assets кладётся scripts/sync-content.mjs и едет в сборку.
  // Не fetch к себе по внешнему адресу: за обратным прокси такой запрос может не пройти,
  // и чат молча оставался без страниц.
  const text = String(await useStorage('assets:server').getItem('llms-full.txt') || '')
  const list = text.split(/\n\n---\n\n(?=# )/).slice(1).map((chunk) => {
    const title = (chunk.match(/^# (.+)$/m) || [])[1] || ''
    const url = (chunk.match(/^URL: (\S+)$/m) || [])[1] || ''
    return { title, url, text: chunk, words: tokens(chunk) }
  })
  if (list.length) cache = { pages: list } // пустое не кэшируем
  return list
}

function pick(all: Page[], question: string, page?: string, firstQuestion = true): Page[] {
  // «Обсудить с ИИ»: клиент прислал путь статьи. Первый запрос — пересказ, в контексте только она;
  // дальше она остаётся темой разговора (идёт первой), а к ней добавляются страницы под новый вопрос
  const pathOf = (u: string) => u.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/'
  const linked = page ? all.filter(p => p.url && pathOf(p.url) === pathOf(page)) : []
  if (linked.length && firstQuestion) return linked
  const q = tokens(question)
  const scored = all.filter(p => !linked.includes(p))
    .map(p => ({ p, s: [...q].reduce((n, w) => n + (p.words.has(w) ? 1 : 0), 0) + (q.size && [...q].some(w => p.title.toLowerCase().includes(w)) ? 3 : 0) }))
    .sort((a, b) => b.s - a.s)
  const out: Page[] = [...linked]
  let size = linked.reduce((n, p) => n + p.text.length, 0)
  for (const { p, s } of scored) {
    if (s === 0 && out.length) break
    if (size + p.text.length > CONTEXT_LIMIT) continue
    out.push(p); size += p.text.length
    if (out.length >= 8) break
  }
  return out
}

export default defineEventHandler(async (event) => {
  const { messages, page } = await readBody(event)
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
  const all = await pages()
  if (!all.length) {
    console.error('[assistant] страницы сайта не загружены: server/assets/llms-full.txt пуст или отсутствует')
    throw createError({ statusCode: 503, message: 'Поиск по сайту недоступен' })
  }
  // пересказ — первый вопрос разговора или запрос «Обсудить с ИИ» посреди него (тот же текст, что шлёт discussPage)
  const firstQuestion = messages.filter((m: any) => m.role === 'user').length <= 1 || question.startsWith('Перескажи статью «')
  const chosen = pick(all, question, typeof page === 'string' ? page : undefined, firstQuestion)

  console.info(`[assistant] страниц: ${all.length}, выбрано: ${chosen.map(p => p.url).join(', ') || '—'}`)

  const instructions = [
    'Ты — помощник по сайту skills-site.bx-shef.by: методология и проверка навыков ИИ-агентов для Битрикса, навыки к модулям shef.*.',
    'Отвечай по-русски, коротко, с точными именами команд, файлов и правил из документации ниже. Заголовки markdown не используй; выделяй жирным.',
    'Пересказывай страницу, только если об этом просят в последнем сообщении пользователя: коротко по-русски (5–8 пунктов) и в конце предложи задать вопрос по ней. На любой другой вопрос — отвечай на него, а не пересказывай.',
    'Давай ссылки на страницы вида [название](URL) — URL бери из строк «URL:» ниже. Если ответа в документации нет — так и скажи и отправь на GitHub bx-shef.',
    'Не придумывай команды, параметры, файлы, классы и термины, которых нет в документации ниже; общих советов «от себя» не давай.',
    '',
    '=== СТРАНИЦЫ САЙТА, ПОДОБРАННЫЕ ПОД ВОПРОС ===',
    ...chosen.map(p => p.text),
  ].join('\n')

  // Сначала — какие страницы подобраны (в чате это шаг «Нашёл страницы»), потом ответ модели вместе с рассуждением
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'data-sources', data: chosen.map(p => ({ title: p.title, url: p.url })) })
      writer.merge(streamText({ system: instructions, model: provider(ai.model), messages: modelMessages }).toUIMessageStream({
        sendReasoning: true,
        // причина остановки — клиенту: «length» значит, что ответ обрезан лимитом токенов
        messageMetadata: ({ part }) => part.type === 'finish' ? { finishReason: part.finishReason } : undefined,
      }))
    },
  })
  return createUIMessageStreamResponse({ stream })
})
