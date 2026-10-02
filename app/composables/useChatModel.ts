/**
 * Название модели чата для подписей. Модель задаётся окружением при запуске (одна на установку),
 * а страницы пререндерятся при сборке — поэтому спрашиваем в браузере, а не зашиваем в HTML.
 */
export const useChatModel = () => {
  const { data } = useFetch<{ model: string, enabled: boolean }>('/api/assistant-info', { key: 'assistant-info', server: false, lazy: true })
  return computed(() => data.value?.model || 'ИИ-модели')
}
