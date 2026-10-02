// Имя модели для подписей в интерфейсе («Ответы <модель> могут быть неточны…») и уходят ли
// оценки ответов авторам сайта (задан приёмник). Без ключа и адресов.
export default defineEventHandler(() => {
  const { name, key } = chatConfig()
  return { model: name, enabled: !!key, ratings: !!process.env.BXSHEF_FEEDBACK_URL }
})
