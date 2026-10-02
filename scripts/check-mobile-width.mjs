// Ни одна страница сайта не шире экрана телефона (360 px). Список страниц — из llms.txt
// (там ссылки на /raw/<путь>.md) плюс служебные. Мобильная эмуляция обязательна: без неё
// браузер не растягивает окно под широкий элемент, и поломка не видна.
// Запуск: node scripts/check-mobile-width.mjs http://localhost:3000
import { chromium } from 'playwright-core'

const base = process.argv[2] || 'http://localhost:3000'
const WIDTH = 360
const index = await (await fetch(`${base}/llms.txt`)).text()
const pages = new Set(['/', '/topics', '/search'])
for (const [, url] of index.matchAll(/\]\((https?:\/\/[^)]+)\)/g))
  pages.add(new URL(url).pathname.replace(/^\/raw/, '').replace(/\.md$/, '') || '/')

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const page = await browser.newPage({ viewport: { width: WIDTH, height: 780 }, isMobile: true, hasTouch: true })
const wide = []
for (const path of pages) {
  await page.goto(base + path, { waitUntil: 'networkidle' })
  const r = await page.evaluate((w) => ({
    width: document.documentElement.scrollWidth,
    culprit: [...document.querySelectorAll('body *')]
      .filter(e => e.getBoundingClientRect().right > w + 1 && !e.closest('pre, svg'))
      .slice(0, 1).map(e => `${e.tagName.toLowerCase()} «${(e.textContent || '').trim().slice(0, 60)}»`)[0] || '',
  }), WIDTH)
  if (r.width > WIDTH) wide.push(`${path}: ${r.width}px ${r.culprit}`)
}
await browser.close()
console.log(`страниц: ${pages.size}, шире ${WIDTH}px: ${wide.length}`)
for (const w of wide) console.log('  ' + w)
process.exit(wide.length ? 1 : 0)
