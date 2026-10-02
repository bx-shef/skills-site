// Качество поиска чата: для каждого вопроса из evals/chat-retrieval.json — попала ли ожидаемая
// страница в контекст, который получит модель. Сравнивает поиск по фрагментам (server/rag) с прежним — словами
// по целым страницам (как было до RAG). Без модели: меряется только поиск.
//   node scripts/rag-eval.mjs [--min 0.8]   — после sync-content (нужен server/assets/rag-chunks.json)
import fs from 'node:fs'
import path from 'node:path'
import { buildIndex, select } from '../server/rag/core.mjs'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const K = 8 // прежний чат отдавал модели до 8 страниц целиком
const min = Number(process.argv[process.argv.indexOf('--min') + 1]) || 0
const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'evals/chat-retrieval.json'), 'utf8'))
const chunks = JSON.parse(fs.readFileSync(path.join(ROOT, 'server/assets/rag-chunks.json'), 'utf8'))
const pageOf = u => u.split('#')[0]

// новый: фрагменты, BM25 — страницы тех фрагментов, что уходят в контекст (как в assistant.post.ts)
const index = buildIndex(chunks)
const rag = q => [...new Set(select(index, q).map(c => c.page))]

// прежний: совпадение слов от 4 букв по целым страницам, +3 за слово в заголовке
const words = s => new Set(s.toLowerCase().match(/[a-zа-яё0-9_.\-]{4,}/g) || [])
const pages = Object.values(chunks.reduce((m, c) => { const u = pageOf(c.url); (m[u] ||= { url: u, title: c.title, text: '' }).text += ` ${c.heading} ${c.text}`; return m }, {}))
  .map(p => ({ ...p, w: words(`${p.title} ${p.text}`) }))
const old = (q) => {
  const qw = [...words(q)]
  return pages.map(p => ({ p, s: qw.reduce((n, w) => n + (p.w.has(w) ? 1 : 0), 0) + (qw.some(w => p.title.toLowerCase().includes(w)) ? 3 : 0) }))
    .filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, K).map(x => x.p.url)
}

let hitOld = 0, hitNew = 0, sizeOld = 0, sizeNew = 0
for (const c of cases) {
  sizeOld += old(c.q).reduce((n, u) => n + pages.find(p => p.url === u).text.length, 0)
  sizeNew += select(index, c.q).reduce((n, d) => n + d.text.length, 0)
  const o = old(c.q).some(u => c.expect.includes(u))
  const n = rag(c.q).some(u => c.expect.includes(u))
  hitOld += o; hitNew += n
  if (!n) console.log(`  промах: «${c.q}» → ${rag(c.q).join(', ') || '—'} (ждали ${c.expect.join(' | ')})`)
}
const pct = x => `${x}/${cases.length} (${Math.round(100 * x / cases.length)}%)`
const kb = x => `${Math.round(x / cases.length / 1000)} КБ`
console.log(`нужная страница в контексте модели: прежний поиск ${pct(hitOld)} (в среднем ${kb(sizeOld)}), фрагменты + BM25 ${pct(hitNew)} (${kb(sizeNew)})`)
if (hitNew / cases.length < min) { console.error(`ниже порога ${min}`); process.exit(1) }
