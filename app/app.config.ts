export default defineAppConfig({
  header: {
    title: 'bxshef',
  },
  socials: {
    github: 'https://github.com/bx-shef',
  },
  github: {
    url: 'https://github.com/bx-shef/skills-site',
    branch: 'main',
    rootDir: '',
  },
  seo: {
    titleTemplate: '%s · bxshef',
    title: 'bxshef — навыки ИИ-агентов для Битрикса',
    description: 'Методология и проверка навыков ИИ-агентов для коробочного Битрикс24 и БУС; навыки к модулям shef.*',
  },
  toc: { title: 'На странице' },
  assistant: {
    floatingInput: false,
    explainWithAi: false,
    faqQuestions: [
      { category: 'Навыки', items: ['Как написать навык для своего модуля?', 'Почему ИИ-агент не берёт мой навык?', 'Как поставить навыки shef.* в проект?'] },
      { category: 'Проверка', items: ['Что проверяет bxshef lint?', 'Как гоняется eval и какой порог?', 'Как устроен прогон на стенде?'] },
      { category: 'Модули', items: ['Что делает shef.insync?', 'Как логировать через shef.problems?'] },
    ],
  },
})
