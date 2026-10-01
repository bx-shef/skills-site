import { queryCollection } from '@nuxt/content/server'

/**
 * /raw/<путь страницы>.md — исходный markdown страницы: для «Посмотреть как Markdown»,
 * «Копировать страницу» и для ИИ-агентов (ChatGPT / Claude получают ссылку на него).
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug') || ''
  const path = '/' + slug.replace(/\.md$/, '')
  const page = await queryCollection(event, 'docs').path(path).first()
  if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  setHeader(event, 'content-type', 'text/markdown; charset=utf-8')
  return `# ${page.title}\n\n${page.description ? `> ${page.description}\n\n` : ''}${(page.rawbody || '').replace(/^---\n[\s\S]*?\n---\n/, '').trim()}\n`
})
