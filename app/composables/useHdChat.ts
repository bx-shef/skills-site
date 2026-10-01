/**
 * Состояние чата с ИИ-агентом, общее для шапки (поиск), меню и оверлея.
 * Поиск по кнопке «→» и пункт меню открывают один и тот же оверлей;
 * `ask` — вопрос, который оверлей отправит сразу после открытия.
 */
export const useHdChat = () => {
  const open = useState('hd-chat-open', () => false)
  const ask = useState<string>('hd-chat-ask', () => '')
  const menuOpen = useState('hd-menu-open', () => false)

  function openChat(question?: string) {
    if (question && question.trim()) ask.value = question.trim()
    open.value = true
    menuOpen.value = false
  }
  function closeChat() { open.value = false }

  return { open, ask, menuOpen, openChat, closeChat }
}
