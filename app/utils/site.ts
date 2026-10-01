import type { ContentNavigationItem } from '@nuxt/content'

/** title / description / og для страницы */
export function useSeo({ title, description, type = 'website', markdown }: { title?: string, description?: string, type?: 'website' | 'article', markdown?: string }) {
  const site = useRuntimeConfig().public.siteUrl as string
  const route = useRoute()
  const image = `${site}/og-image.png`
  useSeoMeta({
    title, description,
    ogTitle: title, ogDescription: description, ogType: type, ogSiteName: 'bxshef', ogLocale: 'ru_RU',
    ogUrl: `${site}${route.path}`, ogImage: image, ogImageWidth: 1200, ogImageHeight: 630, ogImageAlt: 'bxshef Навыки',
    twitterCard: 'summary_large_image', twitterImage: image, twitterTitle: title, twitterDescription: description,
  })
  useHead({
    link: [
      { rel: 'canonical', href: `${site}${route.path}` },
      // markdown-версия страницы — для ИИ-агентов
      ...(markdown ? [{ rel: 'alternate', type: 'text/markdown', href: markdown, title: 'Markdown' }] : []),
    ],
  })
}

/** Путь к странице по дереву навигации: [раздел, подраздел, …, страница] */
export function findPageBreadcrumbs(nav: ContentNavigationItem[] | undefined | null, path: string): Array<{ title: string, path: string }> {
  const walk = (items: ContentNavigationItem[], trail: Array<{ title: string, path: string }>): Array<{ title: string, path: string }> | null => {
    for (const i of items) {
      const next = [...trail, { title: i.title, path: i.path }]
      if (i.path === path && !i.children?.length) return next
      if (i.children?.length) {
        const found = walk(i.children, next)
        if (found) return found
      }
      if (i.path === path) return next
    }
    return null
  }
  return walk(nav || [], []) || []
}
