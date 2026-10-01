export default defineNuxtConfig({
  extends: ['docus'],
  compatibilityDate: '2026-09-01',

  site: {
    name: 'bxshef — навыки ИИ-агентов для Битрикса',
    url: process.env.SITE_URL || 'https://skills-site.bx-shef.by',
  },

  // Вёрстка по образцу виджета поддержки Битрикс24 (helpdesk-docus-kit).
  // Порядок важен: сначала переменные, потом раскладка, потом остальное.
  css: [
    '~/assets/css/tokens.css',
    '~/assets/css/layout.css',
    '~/assets/css/content.css',
    '~/assets/css/components.css',
  ],
  // Только светлая тема: виджет «Битрикс24 Ответы» светлый, и сайт открывается внутри Битрикс24
  colorMode: { classSuffix: '', dataValue: 'theme', preference: 'light', fallback: 'light' },
  // Имена иконок приходят из данных (плитки, .navigation.yml) — сканер их не видит, перечисляем явно
  icon: {
    clientBundle: {
      icons: ['lucide:ruler', 'lucide:sparkles', 'lucide:package', 'lucide:folder', 'lucide:bot', 'lucide:compass',
        'lucide:message-circle', 'lucide:flask-conical', 'lucide:square-terminal', 'lucide:git-pull-request',
        'lucide:folder-git-2', 'lucide:message-square-heart', 'lucide:cloud', 'lucide:file-text', 'lucide:link', 'lucide:check'],
    },
  },

  docus: {
    assistant: {
      // Свой провайдер: BitrixGPT через AI Router (OpenAI-совместимый), см. server/api/assistant.post.ts.
      // Штатная панель Docus не рендерится (app/app.vue) — чат живёт в HdChatOverlay, но ходит на тот же apiPath.
      enabled: true,
      apiPath: '/api/assistant',
      mcpServer: '/mcp',
    },
  },

  // llms.txt / llms-full.txt — то, что читают ИИ-агенты (и наш чат в режиме context)
  llms: {
    domain: process.env.SITE_URL || 'https://skills-site.bx-shef.by',
    title: 'bxshef',
    description: 'Методология и проверка навыков ИИ-агентов для разработки на Битриксе; навыки к модулям shef.*',
    // llms-full.txt собирает scripts/sync-content.mjs в public/ из исходного markdown (штатная генерация падала на вложенном **strong**)
  },

  runtimeConfig: {
    ai: {
      url: process.env.BXSHEF_EVAL_URL || 'https://vibecode.bitrix24.tech/v1',
      key: process.env.BXSHEF_EVAL_KEY || '',
      model: process.env.BXSHEF_CHAT_MODEL || 'bitrix/bitrixgpt-5.6-agent',
      // 'context' — весь сайт (llms-full.txt) в системном промпте; 'mcp' — поиск по документации инструментами (нужна модель с tool calling)
      mode: process.env.ASSISTANT_MODE || 'context',
    },
  },

  nitro: { preset: 'node-server' },
})
