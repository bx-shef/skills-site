/**
 * Состояние чата с ИИ-агентом, общее для поиска (шапка, первый экран), баннера и оверлея.
 * `ask` — вопрос, который оверлей отправит сразу после открытия.
 */
export const useHdChat = () => {
  const open = useState('hd-chat-open', () => false)
  const ask = useState<string>('hd-chat-ask', () => '')

  function openChat(question?: string) {
    if (question && question.trim()) ask.value = question.trim()
    open.value = true
  }
  function closeChat() { open.value = false }

  return { open, ask, openChat, closeChat }
}
