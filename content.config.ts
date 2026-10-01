// Коллекция лендинга: слой Docus её не заводит, когда в проекте есть app/pages/index.vue.
// Остальные коллекции (docs) — из слоя Docus.
import { defineContentConfig, defineCollection } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: { include: 'index.md' },
    }),
  },
})
