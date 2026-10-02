// Поиск по сайту для чата: фрагменты страниц по заголовкам ## / ###, BM25 со стеммингом.
// Без зависимостей и без Nuxt: этим же модулем индекс строит scripts/sync-content.mjs,
// ищет server/api/assistant.post.ts и меряет scripts/rag-eval.mjs.

// --- Токены ---------------------------------------------------------------
const STOP = new Set(('и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по только ее мне было вот от меня еще нет о из ему теперь когда даже ну вдруг ли если уже или ни быть был него до вас нибудь опять уж вам ведь там потом себя ничего ей может они тут где есть надо ней для мы тебя их чем была сам чтоб без будто чего раз тоже себе под будет ж тогда кто этот того потому этого какой совсем ним здесь этом один почти мой тем чтобы почему зачем какие каких каким нее сейчас были куда зачем всех никогда можно при наконец два об другой хоть после над больше тот через эти нас про всего них какая много разве три эту моя впрочем хорошо свою этой перед иногда лучше чуть том нельзя такой им более всегда конечно всю между это the a an and or of to in is for on with as by be at it this that'.split(' ')))

// Окончания русских слов — от длинных к коротким (облегчённый Snowball: «навыка», «навыки», «навыком» → «навык»)
const ENDINGS = ['иями', 'ями', 'ами', 'иях', 'ией', 'ием', 'ого', 'его', 'ому', 'ему', 'ыми', 'ими', 'ость', 'ости', 'ств', 'ться', 'тся', 'ешь', 'ете', 'ите', 'ает', 'яет', 'ует', 'ают', 'яют', 'уют', 'ала', 'яла', 'ила', 'ыла', 'ело', 'ать', 'ять', 'ить', 'еть', 'уть', 'ая', 'яя', 'ое', 'ее', 'ые', 'ие', 'ой', 'ей', 'ий', 'ый', 'ую', 'юю', 'ом', 'ем', 'ам', 'ям', 'ах', 'ях', 'ов', 'ев', 'ия', 'ию', 'ии', 'ть', 'ла', 'ло', 'ли', 'а', 'я', 'о', 'е', 'ы', 'и', 'у', 'ю', 'ь', 'й']
export function stem(w) {
  if (!/[а-яё]/.test(w)) return w
  w = w.replace(/ё/g, 'е')
  for (const e of ENDINGS) if (w.length - e.length >= 3 && w.endsWith(e)) return w.slice(0, -e.length)
  return w
}

// shef.options → shef.options, shef, options; bxshef_eval → целиком и по частям
export function tokens(text) {
  const out = []
  for (const raw of String(text).toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}_.-]*/gu) || []) {
    const w = raw.replace(/[.-]+$/, '')
    if (w.length < 2 || STOP.has(w)) continue
    out.push(stem(w))
    if (/[._-]/.test(w)) for (const p of w.split(/[._-]+/)) if (p.length >= 2 && !STOP.has(p)) out.push(stem(p))
  }
  return out
}

// --- Фрагменты ------------------------------------------------------------
// Якорь заголовка — как его ставит Nuxt Content: буквы и цифры, пробелы → «-», ведущая цифра — с «_»
export function anchor(heading) {
  const s = heading.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
  return /^\d/.test(s) ? `_${s}` : s
}

const MAX_CHUNK = 4000
// md без frontmatter → [{ title, heading, url, text }]: вступление и каждый ## / ### отдельно
export function chunkPage(md, { title, url }) {
  title = title.replace(/\[`?([^`\]]+)`?\]\([^)]*\)/g, '$1').replace(/`/g, '') // [`\Shef\X`](…) → \Shef\X
  const out = []
  let heading = ''
  let buf = []
  let fence = false
  const flush = () => {
    const text = buf.join('\n').trim()
    if (text) out.push({ title, heading, url: heading ? `${url}#${anchor(heading)}` : url, text: text.slice(0, MAX_CHUNK) })
    buf = []
  }
  for (const line of md.split('\n')) {
    if (/^```/.test(line)) fence = !fence
    const h = !fence && line.match(/^#{2,3}\s+(.+?)\s*#*$/)
    if (h) { flush(); heading = h[1].replace(/`/g, ''); continue }
    buf.push(line)
  }
  flush()
  return out
}

// --- Индекс и поиск (BM25) ------------------------------------------------
// Заголовки страницы и раздела весят втрое: «Стандарт навыка» найдётся по названию
function bm25(items) {
  const df = {}
  for (const d of items) for (const t of Object.keys(d.tf)) df[t] = (df[t] || 0) + 1
  const avg = items.reduce((n, d) => n + d.len, 0) / (items.length || 1)
  return { df, avg, n: items.length }
}
function score(st, d, q, k1 = 1.2, b = 0.75) {
  let s = 0
  for (const t of q) {
    const f = d.tf[t]
    if (!f) continue
    const idf = Math.log(1 + (st.n - st.df[t] + 0.5) / (st.df[t] + 0.5))
    s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / st.avg))
  }
  return s
}

// Фрагмент оценивается сам и вместе со своей страницей: вопрос «как добавить опцию на страницу
// настроек» часто совпадает со страницей целиком, а не с одним её разделом
export function buildIndex(chunks) {
  const pages = {}
  const docs = chunks.map((c) => {
    const tf = {}
    const head = tokens(`${c.title} ${c.heading}`)
    const all = [...head, ...head, ...head, ...tokens(c.text)]
    for (const t of all) tf[t] = (tf[t] || 0) + 1
    const page = c.url.split('#')[0]
    const p = (pages[page] ||= { tf: {}, len: 0 })
    if (!p.len) for (const t of tokens(c.title)) { p.tf[t] = (p.tf[t] || 0) + 3; p.len += 3 }
    for (const t of tokens(`${c.heading} ${c.text}`)) { p.tf[t] = (p.tf[t] || 0) + 1; p.len++ }
    return { ...c, page, tf, len: all.length }
  })
  return { docs, pages, chunkStats: bm25(docs), pageStats: bm25(Object.values(pages)) }
}

export function search(index, query, { limit = 8, pageWeight = 0.5 } = {}) {
  const q = [...new Set(tokens(query))]
  if (!q.length) return []
  const ps = {}
  for (const [u, p] of Object.entries(index.pages)) ps[u] = score(index.pageStats, p, q)
  return index.docs.map((d) => {
    const own = score(index.chunkStats, d, q)
    return { d, s: own ? own + pageWeight * ps[d.page] : 0 }
  }).filter(x => x.s > 0).sort((a, b2) => b2.s - a.s).slice(0, limit).map(x => ({ ...x.d, score: x.s }))
}

// Контекст для модели: лучшие фрагменты, пока влезают в budget символов. Сначала — фрагменты
// обсуждаемой страницы (page — путь), если она задана.
export const BUDGET = 24_000
export function select(index, query, { page, budget = BUDGET, max = 16 } = {}) {
  const own = page ? index.docs.filter(d => d.page === page) : []
  const found = search(index, query, { limit: 60 }).filter(d => d.page !== page)
  const out = []
  let size = 0
  for (const d of [...own, ...found]) {
    if (size + d.text.length > budget) continue
    out.push(d); size += d.text.length
    if (out.length >= max) break
  }
  return out
}
