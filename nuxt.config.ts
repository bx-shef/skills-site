export default defineNuxtConfig({
  // Bitrix24 UI вместо Nuxt UI (и вместо Docus, который без Nuxt UI не живёт): сайт открывается внутри Битрикс24
  modules: ['@bitrix24/b24ui-nuxt', '@nuxt/content'],
  compatibilityDate: '2026-09-01',

  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      link: [{ rel: 'icon', href: '/favicon.ico' }],
      // Закрыт от индексации до запуска, открыть — bx-shef/skills-site#8 (вместе с public/robots.txt и X-Robots-Tag ниже)
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },

  // Вёрстка по образцу виджета «Битрикс24 Ответы». Порядок важен:
  // база b24ui, потом переменные, раскладка, текст, блоки.
  css: [
    '~/assets/css/main.css',
    '~/assets/css/tokens.css',
    '~/assets/css/layout.css',
    '~/assets/css/content.css',
    '~/assets/css/components.css',
  ],

  content: {
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 3 },
        // light задан явно: иначе при классе .light на <html> берётся бледная material-theme-lighter по умолчанию;
        // high-contrast — потому что обычные github-* на подложке блока кода не дотягивают до 4.5:1
        highlight: { theme: { default: 'github-light-high-contrast', light: 'github-light-high-contrast', dark: 'github-dark-high-contrast' } },
      },
    },
  },

  runtimeConfig: {
    // модель чата — из окружения при запуске, см. server/utils/chat-config.ts
    public: {
      siteUrl: process.env.SITE_URL || 'https://skills-site.bx-shef.by',
    },
  },

  nitro: {
    preset: 'node-server',
    // Закрыт от индексации до запуска: заголовок покрывает и не-HTML (llms.txt, /raw/*.md)
    routeRules: { '/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } } },
    prerender: { crawlLinks: true, routes: ['/', '/topics'] },
  },
})
