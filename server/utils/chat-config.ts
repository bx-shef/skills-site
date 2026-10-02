/**
 * Модель чата — одна на установку, из окружения при запуске (не при сборке: ключ не должен
 * попасть в образ, а модель меняется без пересборки).
 *
 *   BXSHEF_CHAT_URL         адрес OpenAI-совместимого API   (запасной: BXSHEF_EVAL_URL)
 *   BXSHEF_CHAT_KEY         ключ                             (запасной: BXSHEF_EVAL_KEY)
 *   BXSHEF_CHAT_MODEL       id модели у провайдера
 *   BXSHEF_CHAT_MODEL_NAME  как модель называть на сайте; не задано — по id из KNOWN_NAMES
 *
 * Запасные BXSHEF_EVAL_* — переменные `bxshef eval`; чат раньше брал их, установки с ними работают.
 */
const DEFAULT_URL = 'https://vibecode.bitrix24.tech/v1'
const DEFAULT_MODEL = 'bitrix/bitrixgpt-5.6-agent'

// подстрока id модели → имя для подписи на сайте
const KNOWN_NAMES: Array<[RegExp, string]> = [
  [/bitrixgpt/i, 'BitrixGPT'],
  [/deepseek/i, 'DeepSeek'],
  [/claude/i, 'Claude'],
  [/gpt-|^o\d/i, 'GPT'],
  [/qwen/i, 'Qwen'],
  [/gemini/i, 'Gemini'],
]

export const modelName = (model: string) =>
  process.env.BXSHEF_CHAT_MODEL_NAME || KNOWN_NAMES.find(([re]) => re.test(model))?.[1] || model.split('/').pop() || model

export function chatConfig() {
  const model = process.env.BXSHEF_CHAT_MODEL || DEFAULT_MODEL
  return {
    url: process.env.BXSHEF_CHAT_URL || process.env.BXSHEF_EVAL_URL || DEFAULT_URL,
    key: process.env.BXSHEF_CHAT_KEY || process.env.BXSHEF_EVAL_KEY || '',
    model,
    name: modelName(model),
  }
}
