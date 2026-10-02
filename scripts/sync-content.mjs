#!/usr/bin/env node
/**
 * Собирает content/ сайта из репозиториев — второй копии текстов нет.
 *
 *   node scripts/sync-content.mjs            клонирует в .sources/ и раскладывает
 *   SOURCES_DIR=../  node scripts/sync-content.mjs   взять уже склонированные рядом каталоги
 *
 * Источники: bx-shef/skills-standard (методология), bx-shef/skills (навыки),
 * bx-shef/{options,problems,insync} (документация модулей). Ветка main.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.resolve(process.env.SOURCES_DIR || path.join(ROOT, '.sources'))
const OUT = path.join(ROOT, 'content')
const ORG = 'https://github.com/bx-shef'
const REPOS = ['skills-standard', 'skills', 'options', 'problems', 'insync']

fs.mkdirSync(SRC, { recursive: true })
for (const r of REPOS) {
  const dir = path.join(SRC, r)
  if (fs.existsSync(dir)) { try { execSync('git pull -q --ff-only', { cwd: dir, stdio: 'ignore' }) } catch {} }
  else execSync(`git clone -q --depth 1 ${ORG}/${r}.git ${dir}`, { stdio: 'inherit' })
}

// content/ пересобирается целиком, кроме index.md (лендинг пишется руками)
for (const e of fs.readdirSync(OUT)) if (e !== 'index.md') fs.rmSync(path.join(OUT, e), { recursive: true, force: true })

// CRLF → LF: при git autocrlf (Windows) «.» в регулярках не берёт \r, и заголовок H1 не срезался
const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n') : null
const write = (rel, text) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text) }
const stripFront = (md) => md.replace(/^---\n[\s\S]*?\n---\n/, '')
const titleOf = (md, fallback) => (md.match(/^#\s+(.+)$/m) || [])[1] || fallback
const page = (md, { title, description, source }) => {
  const body = stripFront(md).replace(/^#\s+.+\n/, '')
  const fm = ['---', `title: ${JSON.stringify(title)}`, description ? `description: ${JSON.stringify(description)}` : null, '---'].filter(Boolean).join('\n')
  const foot = source ? `\n\n::note\nИсточник: [${source.label}](${source.url}) — правки туда, сайт пересобирается сам.\n::\n` : ''
  return `${fm}\n\n${body.trim()}${foot}\n`
}
const gh = (repo, file) => ({ label: `${repo}/${file}`, url: `${ORG}/${repo}/blob/main/${file}` })
// Относительные ссылки (от каталога dir файла-источника): страница модуля, которая есть на сайте
// (docs/*.md, README.md) — на сайт; остальное (CONTRIBUTING.md, examples/*.php, logrotate/…) — на GitHub.
const absLinks = (md, repo, dir = '') => md.replace(/\]\((?!https?:|mailto:|#|\/)([^)\s#]+)(#[^)\s]*)?\)/g, (_, f, anchor = '') => {
  const file = path.posix.normalize(path.posix.join(dir, f))
  if (file === 'README.md') return `](/modules/${repo}${anchor})`
  const doc = file.match(/^docs\/([^/]+)\.md$/)
  if (doc && fs.existsSync(path.join(SRC, repo, file))) return `](/modules/${repo}/${doc[1].replace(/^\d+_/, '')}${anchor})`
  return `](${ORG}/${repo}/blob/main/${file}${anchor})`
})

// 1. Методология
const std = path.join(SRC, 'skills-standard')
const stdPages = [
  ['1.standard.md', 'STANDARD.md', 'Стандарт навыка', '11 правил оформления SKILL.md'],
  ['2.method.md', 'METHOD.md', 'Методология проверки', 'lint → eval → стенд: что проверяется'],
  ['3.bxshef.md', 'bxshef/README.md', 'bxshef — CLI', 'lint, eval, feedback'],
  ['4.action.md', 'action/README.md', 'GitHub Action', 'тот же lint + eval в любом репозитории навыков'],
  ['5.template.md', 'template/README.md', 'Заготовка репозитория', 'с чего начать автору модуля'],
  ['6.feedback.md', 'feedback/README.md', 'Приёмник отзывов', 'куда уходят отзывы ИИ-агентов'],
]
write('1.methodology/.navigation.yml', 'title: Методология\nicon: ruler\n')
write('1.methodology/index.md', page(read(path.join(std, 'README.md')) || '# bxshef', { title: 'bxshef: методология и проверка навыков', description: 'Как писать и проверять навыки ИИ-агентов для Битрикса', source: gh('skills-standard', 'README.md') }))
// В STANDARD.md правило — жирное начало абзаца («**1. Имя — …** текст»). На сайте — заголовок
// «## 1. Имя — …»: у страницы появляется оглавление и якоря на каждое правило.
const ruleHeadings = (md) => md.replace(/^\*\*(\d+\.\s[^\n]*?)\*\*[ \t]*/gm, (_, h) => `## ${h.replace(/\.$/, '')}\n\n`)
for (const [out, file, title, description] of stdPages) {
  let md = read(path.join(std, file)); if (!md) continue
  if (file === 'STANDARD.md') md = ruleHeadings(md)
  write(`1.methodology/${out}`, page(absLinks(md, 'skills-standard'), { title, description, source: gh('skills-standard', file) }))
}

// 2. Навыки
const sk = path.join(SRC, 'skills')
write('2.skills/.navigation.yml', 'title: Навыки\nicon: sparkles\n')
write('2.skills/index.md', page(read(path.join(sk, 'README.md')) || '# Навыки', { title: 'Навыки shef.*', description: 'npx skills add bx-shef/skills', source: gh('skills', 'README.md') }))
const skillsDir = path.join(sk, 'skills')
let i = 1
for (const name of fs.readdirSync(skillsDir).sort()) {
  const md = read(path.join(skillsDir, name, 'SKILL.md')); if (!md) continue
  const desc = (md.match(/^description:\s*(.+)$/m) || [])[1] || ''
  write(`2.skills/${i++}.${name}.md`, page(md, { title: name, description: desc.slice(0, 160), source: gh('skills', `skills/${name}/SKILL.md`) }))
}

// 3. Модули
write('3.modules/.navigation.yml', 'title: Модули shef.*\nicon: package\n')
// Модули — через задачи, которые они решают, а не через устройство (интерфейсы и классы — в docs/ модулей)
const modules = [
  ['options', 'shef.options', 'страница настроек, агенты, ajax и компоненты своего модуля — без рутины', [
    'Страница настроек своего модуля: строки, числа, флажки, списки, пользователи, отделы, справочники CRM — с правами и вкладками.',
    'Агент или cron-задача, которые не запустятся дважды и работают от служебного пользователя.',
    'Ajax-действие по кнопке с проверкой прав внутри действия, а не только на показ кнопки.',
    'Разбор входных полей вида «1 234,50», неразрывные пробелы, обязательные поля — одной строкой.',
    'Пользовательские поля, смарт-процессы и пресеты реквизитов CRM, созданные установщиком модуля и убранные при удалении.',
  ], 'у модуля нет своих настроек, агентов и ajax.'],
  ['problems', 'shef.problems', 'сбои в журнал событий Битрикса — с типом и ответственным', [
    'Ошибка обмена, импорта или выгрузки попадает в журнал событий с типом (синхронизация, товары, продажи) и ответственным из настроек.',
    'Исключение, Result или Error ядра — в лог одной строкой.',
    'Отладка на экране видна администратору и не видна пользователям.',
    'Логи вне корня сайта, с ротацией.',
  ], 'хватает следа в файл без журнала событий и ответственных — для этого трейт Log из shef.options.'],
  ['insync', 'shef.insync', 'импорт и обмены по расписанию: файлы, CRM, внешние API', [
    'Прайс или каталог поставщика из CSV или XML по расписанию — в товары, цены, остатки, разделы.',
    'Большая выгрузка (1С, маркетплейс) разбирается агентом пачками, без таймаутов; упавшие строки остаются на повтор.',
    'Ручная загрузка файла импорта со страницы — с правами и проверкой имени файла.',
    'Клиент к внешнему HTTP-API: таймауты, ошибки бизнес-логики при HTTP 200, сбои в журнал событий без ключей в логе.',
    'Перенос данных CRM в смарт-процесс пачками.',
  ], 'нужен разовый перенос данных скриптом: модуль рассчитан на повторяемые обмены.'],
]
const modulesIndex = [
  '---', 'title: Модули shef.*', 'description: Какие задачи решает каждый модуль и что за чем ставить', '---', '',
  'Три открытых модуля (MIT) для коробочного Битрикс24 и БУС, один на другом: **shef.options** → **shef.problems** → **shef.insync**. Навыки ко всем трём — в одном наборе: `npx skills add bx-shef/skills`.',
  ...modules.flatMap(([r, id, , tasks, notFor]) => [
    '', `## [${id}](/modules/${r})`, '', 'Какие задачи решает:', '', ...tasks.map(t => `- ${t}`), '',
    `Не нужен, когда ${notFor}`, '', `Установка: \`composer require bxshef/${r}\``,
  ]),
  '',
].join('\n')
write('3.modules/index.md', modulesIndex)
modules.forEach(([r, id, d], mi) => {
  const base = path.join(SRC, r)
  write(`3.modules/${mi + 1}.${r}/.navigation.yml`, `title: ${id}\n`)
  write(`3.modules/${mi + 1}.${r}/index.md`, page(absLinks(read(path.join(base, 'README.md')) || `# ${id}`, r), { title: id, description: d, source: gh(r, 'README.md') }))
  const docs = path.join(base, 'docs')
  if (!fs.existsSync(docs)) return
  let j = 1
  for (const f of fs.readdirSync(docs).filter(f => f.endsWith('.md')).sort()) {
    const md = read(path.join(docs, f))
    const slug = f.replace(/^\d+_/, '').replace(/\.md$/, '')
    write(`3.modules/${mi + 1}.${r}/${j++}.${slug}.md`, page(absLinks(md, r, 'docs'), { title: titleOf(md, slug), source: gh(r, `docs/${f}`) }))
  }
})
// 4. llms-full.txt — весь сайт одним файлом для ИИ-агентов и для чата (режим context)
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.md') ? [path.join(d, e.name)] : [])
const urlOf = (file) => '/' + path.relative(OUT, file).replace(/\\/g, '/').replace(/(^|\/)\d+\./g, '$1').replace(/\/index\.md$|\.md$/, '').replace(/^index$/, '')
const site = process.env.SITE_URL || 'https://skills-site.bx-shef.by'
const full = ['# bxshef — навыки ИИ-агентов для Битрикса', '', `> Методология и проверка навыков ИИ-агентов для коробочного Битрикс24 и БУС; навыки к модулям shef.*. Сайт: ${site}`, '']
for (const f of walk(OUT).sort()) {
  const md = fs.readFileSync(f, 'utf8')
  const title = (md.match(/^title:\s*"?(.+?)"?$/m) || [])[1] || path.basename(f, '.md')
  full.push(`\n\n---\n\n# ${title}\n\nURL: ${site}${urlOf(f)}\n\n${stripFront(md).replace(/^::note[\s\S]*?::\n?/m, '').trim()}`)
}
fs.mkdirSync(path.join(ROOT, 'public'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'public', 'llms-full.txt'), full.join('\n'))
// та же копия — серверу чата: читается из сборки (useStorage('assets:server')), без HTTP-запроса к себе
fs.mkdirSync(path.join(ROOT, 'server', 'assets'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'server', 'assets', 'llms-full.txt'), full.join('\n'))
// llms.txt — оглавление сайта со ссылками на страницы (формат llmstxt.org)
const index = ['# bxshef', '', '> Методология и проверка навыков ИИ-агентов для разработки на Битриксе; навыки к модулям shef.*', '', `Весь сайт одним файлом: ${site}/llms-full.txt`, '', '## Документация', '']
for (const f of walk(OUT).sort()) {
  if (path.relative(OUT, f) === 'index.md') continue
  const md = fs.readFileSync(f, 'utf8')
  const title = (md.match(/^title:\s*"?(.+?)"?$/m) || [])[1] || path.basename(f, '.md')
  const desc = (md.match(/^description:\s*"?(.+?)"?$/m) || [])[1]
  // по llmstxt.org — ссылка на markdown-версию страницы (/raw/<путь>.md отдаёт server/routes/raw)
  index.push(`- [${title}](${site}/raw${urlOf(f)}.md)${desc ? `: ${desc}` : ''}`)
}
fs.writeFileSync(path.join(ROOT, 'public', 'llms.txt'), index.join('\n') + '\n')
console.log('content/ собран из', REPOS.join(', '))
