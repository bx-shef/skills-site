/**
 * Название модели чата для подписей. Модель задаётся окружением при запуске (одна на установку),
 * а страницы пререндерятся при сборке — поэтому спрашиваем в браузере, а не зашиваем в HTML.
 */
const useAssistantInfo = () =>
  useFetch<{ model: string, enabled: boolean, ratings: boolean }>('/api/assistant-info', { key: 'assistant-info', server: false, lazy: true })

export const useChatModel = () => {
  const { data } = useAssistantInfo()
  return computed(() => data.value?.model || 'ИИ-модели')
}

// Уходят ли оценки ответов авторам сайта (на сервере задан приёмник отзывов)
export const useChatRatings = () => {
  const { data } = useAssistantInfo()
  return computed(() => !!data.value?.ratings)
}
