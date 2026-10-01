// Коллекции контента: landing — главная (content/index.md), docs — всё, что собирает scripts/sync-content.mjs
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: { include: 'index.md' },
    }),
    docs: defineCollection({
      type: 'page',
      // '**', а не '**/*.md': заголовки и иконки разделов лежат в .navigation.yml
      source: { include: '**', exclude: ['index.md'] },
      // исходный markdown — для /raw/<страница>.md и кнопки «Копировать страницу»
      schema: z.object({ rawbody: z.string() }),
    }),
  },
})
