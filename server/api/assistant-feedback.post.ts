/**
 * Оценка ответа чата или статьи («полезно / не помогло») → приёмник отзывов
 * skills-standard/feedback, категория RATING. Статья — kind: 'article', с ней может прийти
 * comment («чего не хватило»). Браузер приёмник не видит: адрес и токен — в окружении сайта.
 *
 *   BXSHEF_FEEDBACK_URL    адрес приёмника (без /feedback); пусто — оценки не отправляются (204)
 *   BXSHEF_FEEDBACK_TOKEN  токен, если приёмник требует его на отправку (FEEDBACK_TOKEN)
 *
 * При «не помогло» уходят вопрос, ответ и подобранные страницы — без них оценку не разобрать;
 * приёмник сам вычищает из текста адреса, почту, ключи. При «полезно» — только оценка.
 */
const SOURCE = 'skills-site'
const pathOf = (u: unknown) => { try { return new URL(String(u), 'http://x').pathname } catch { return '' } }

export default defineEventHandler(async (event) => {
  const url = process.env.BXSHEF_FEEDBACK_URL || ''
  if (!url) { setResponseStatus(event, 204); return null }

  const b = await readBody(event).catch(() => null)
  const rating = b?.rating === 1 || b?.rating === -1 ? b.rating : 0
  if (!rating) throw createError({ statusCode: 400, message: 'rating — 1 или -1' })
  const cut = (s: unknown, n: number) => String(s ?? '').trim().slice(0, n)
  const question = cut(b.question, 2000)
  const answer = cut(b.answer, 6000)
  const article = b.kind === 'article'
  const comment = cut(b.comment, 2000)
  const body = article
    ? `${rating === 1 ? 'Статья помогла.' : 'Статья не помогла.'}${comment ? `\n\n${comment}` : ''}`
    : rating === -1 && (question || answer)
    ? `Не помогло.\n\nВопрос: ${question || '—'}\n\nОтвет: ${answer || '—'}`
    : rating === 1 ? 'Оценка: полезно.' : 'Оценка: не помогло, без текста.'

  const ticket = {
    category: 'RATING',
    title: `${article ? 'Статья' : 'Чат'}: ${rating === 1 ? 'полезно' : 'не помогло'}`,
    body,
    context: {
      skill: SOURCE,
      rating,
      model: article ? undefined : chatConfig().model,
      page: pathOf(b.page) || undefined,
      sources: !article && Array.isArray(b.sources) ? b.sources.slice(0, 10).map(pathOf).filter(Boolean) : undefined,
    },
  }
  const token = process.env.BXSHEF_FEEDBACK_TOKEN
  const r = await fetch(`${url.replace(/\/+$/, '')}/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(ticket),
  }).catch((e: Error) => { console.error(`[assistant-feedback] приёмник недоступен: ${e.message}`); return null })
  if (!r || !r.ok) {
    if (r) console.error(`[assistant-feedback] приёмник ответил ${r.status}`)
    throw createError({ statusCode: 502, message: 'Оценка не сохранена' })
  }
  setResponseStatus(event, 201)
  return { ok: true }
})
