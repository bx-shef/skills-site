export default defineAppConfig({
  // Тема Bitrix24 UI: useColorMode (VueUse) ставит класс .dark на <html>; по умолчанию — как в системе
  colorMode: true,
  colorModeInitialValue: 'auto',
  b24ui: {
    prose: {
      // Блок кода без языка Bitrix24 UI красит светло-зелёным (text-green-350) — на светлой
      // подложке он нечитаем. Цвет текста — из токена темы, он свой у светлой и тёмной.
      pre: { slots: { base: 'text-(--hd-text-primary)' } },
    },
  },
  seo: {
    title: 'bxshef — навыки ИИ-агентов для Битрикса',
    description: 'Методология и проверка навыков ИИ-агентов для коробочного Битрикс24 и БУС; навыки к модулям shef.*',
  },
})
