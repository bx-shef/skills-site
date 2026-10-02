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
        highlight: { theme: { default: 'github-light', dark: 'github-dark' } },
      },
    },
  },

  runtimeConfig: {
    ai: {
      url: process.env.BXSHEF_EVAL_URL || 'https://vibecode.bitrix24.tech/v1',
      // ключ не берём при сборке — иначе он попадёт в .output; сервер читает BXSHEF_EVAL_KEY при запуске
      key: '',
      model: process.env.BXSHEF_CHAT_MODEL || 'bitrix/bitrixgpt-5.6-agent',
    },
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
