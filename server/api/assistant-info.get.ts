// Имя модели для подписей в интерфейсе («Ответы <модель> могут быть неточны…»). Без ключа и адреса.
export default defineEventHandler(() => {
  const { name, key } = chatConfig()
  return { model: name, enabled: !!key }
})
