// Текст в блоках кода читается: контраст каждого цвета подсветки к подложке блока — не ниже
// 4.5:1 (WCAG AA), в светлой и тёмной теме, на всех страницах из llms.txt.
// Запуск: node scripts/check-code-contrast.mjs http://localhost:3000
import { chromium } from 'playwright-core'

const base = process.argv[2] || 'http://localhost:3000'
const MIN = 4.5
const index = await (await fetch(`${base}/llms.txt`)).text()
const pages = new Set()
for (const [, url] of index.matchAll(/\]\((https?:\/\/[^)]+)\)/g))
  pages.add(new URL(url).pathname.replace(/^\/raw/, '').replace(/\.md$/, '') || '/')

const luminance = (rgb) => {
  const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
const low = []
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ colorScheme: scheme })
  for (const path of pages) {
    await page.goto(base + path, { waitUntil: 'networkidle' })
    // цвет каждого узла с собственным текстом внутри <pre>, и подложка самого <pre>
    const colors = await page.evaluate(() => [...document.querySelectorAll('.hd-article pre')].flatMap((pre) => {
      // подложка — у ближайшего предка с непрозрачной заливкой (у <pre> в группах кода её нет)
      let el = pre
      let bg = getComputedStyle(el).backgroundColor
      while (el && /rgba\(.*, 0\)$|transparent/.test(bg)) { el = el.parentElement; bg = el ? getComputedStyle(el).backgroundColor : 'rgb(255, 255, 255)' }
      return [pre, ...pre.querySelectorAll('*')]
        .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
        .map(e => ({ color: getComputedStyle(e).color, bg, text: e.textContent.trim().slice(0, 30) }))
    }))
    const seen = new Set()
    for (const c of colors) {
      const key = c.color + c.bg
      if (seen.has(key)) continue
      seen.add(key)
      const ratio = contrast(c.color, c.bg)
      if (ratio < MIN) low.push(`${scheme} ${path}: ${ratio.toFixed(2)} ${c.color} на ${c.bg} «${c.text}»`)
    }
  }
  await page.close()
}
await browser.close()
console.log(`страниц: ${pages.size} × 2 темы, цветов в коде ниже ${MIN}:1 — ${low.length}`)
for (const l of low) console.log('  ' + l)
process.exit(low.length ? 1 : 0)
