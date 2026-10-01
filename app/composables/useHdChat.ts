/**
 * Состояние чата с ИИ-агентом, общее для поиска (шапка, первый экран), баннера и оверлея.
 * `ask` — вопрос, который оверлей отправит сразу после открытия.
 */
export const useHdChat = () => {
  const open = useState('hd-chat-open', () => false)
  const ask = useState<string>('hd-chat-ask', () => '')
  // Статья, которую обсуждаем («Обсудить с ИИ»): сервер кладёт в контекст только её
  const page = useState<{ path: string, title: string } | null>('hd-chat-page', () => null)

  // Открыт ли чат — помним между визитами (localStorage); восстанавливает HdChatOverlay при загрузке
  const remember = (v: boolean) => { try { localStorage.setItem('hd-chat-open', v ? '1' : '0') } catch { /* приватный режим */ } }

  function openChat(question?: string) {
    if (question && question.trim()) ask.value = question.trim()
    open.value = true
    remember(true)
  }
  function closeChat() { open.value = false; remember(false) }

  function discussPage(path: string, title: string) {
    page.value = { path, title }
    openChat(`Перескажи статью «${title}» и предложи задать по ней вопросы.`)
  }

  return { open, ask, page, openChat, closeChat, discussPage }
}
