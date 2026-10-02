# skills-site.bx-shef.by

Сайт методологии bxshef: Nuxt + [Nuxt Content](https://content.nuxt.com) + [Bitrix24 UI](https://github.com/bitrix24/b24ui) в Docker, контент из репозиториев
bx-shef при сборке образа, чат по содержимому сайта (модель — одна на установку, см. «Модель чата»), `llms.txt` / `llms-full.txt`
для ИИ-агентов. Интерфейс на Bitrix24 UI — сайт открывается и внутри Битрикс24.

```
content/index.md               лендинг — единственный текст, который живёт здесь
scripts/sync-content.mjs       клонирует skills-standard, skills, options, problems, insync → content/, public/llms.txt, public/llms-full.txt
server/api/assistant.post.ts   чат: OpenAI-совместимый провайдер (server/utils/chat-config.ts), подбор страниц под вопрос
app/
  app.vue                      оболочка: B24App (Bitrix24 UI), навигация по контенту
  app.config.ts                заголовок и описание сайта
  utils/site.ts                useSeo, крошки по навигации
  layouts/helpdesk.vue         макет: шапка с поиском, меню-иконки 84px слева (HdMenu, раскрывается по наведению), кнопка «Наверх», статья на белом листе с оглавлением, подвал
  components/Hd*.vue           шапка, поиск (шапка и первый экран), чат-оверлей, оглавление «В этой статье», крошки, баннер ИИ-поиска
  components/content/          hd-cards / hd-card / hd-faq / hd-faq-item — для markdown лендинга
  assets/css/                  tokens → layout → content → components (порядок важен)
  pages/index.vue              главная: ИИ-поиск, плитки тем, промо, «Самые читаемые статьи»
  pages/topics.vue             «Все темы» (база знаний) — из навигации контента
  pages/search.vue             «Интеллектуальный поиск» (/search?q=) — по словам в разделах страниц
  pages/[[lang]]/[...slug].vue страницы документации
content.config.ts              коллекции landing (content/index.md) и docs (остальное, с .navigation.yml)
Dockerfile                     двухэтапная сборка: sync-content + nuxt build → node-server
docker-compose.prod.yml        прод: образ ghcr.io/bx-shef/skills-site за nginx-proxy, Watchtower
docker-compose.yml             локальная сборка из исходников на 127.0.0.1:3000
Makefile                       prod-up / prod-redeploy / logs / health / doctor / self-update
.github/workflows/site-image.yml   сборка образа: PR — проверка; main, расписание, dispatch — публикация :latest
```

## Сервер

Схема — как у приёмника отзывов (`skills-standard/feedback`): на хосте уже есть сеть `proxy-net`,
общий `nginx-proxy` + `acme-companion` и Watchtower с `--label-enable`. Своих не поднимаем.

```bash
mkdir -p /home/bitrix/skills-site && cd /home/bitrix/skills-site
curl -fsSLO https://raw.githubusercontent.com/bx-shef/skills-site/main/docker-compose.prod.yml
curl -fsSLO https://raw.githubusercontent.com/bx-shef/skills-site/main/Makefile
curl -fsSL  https://raw.githubusercontent.com/bx-shef/skills-site/main/.env.example -o .env
umask 077 && $EDITOR .env        # DOMAIN, LETSENCRYPT_EMAIL, BXSHEF_CHAT_KEY (модель — «Модель чата»)
make doctor                      # сеть, прокси, Watchtower, .env
make prod-up                     # образ из ghcr.io, TLS выпустит acme-companion
make health                      # сайт 200, чат 200 (или 503 без ключа)
```

**Стриминг чата.** nginx-proxy буферизует ответы, и без настройки ответ ИИ-агента приходит одним
куском в конце. Метки для этого у nginx-proxy нет — на хосте, в каталоге `vhost.d`, который
смонтирован в `nginx-proxy`:

```bash
echo 'proxy_buffering off;' > /path/to/vhost.d/skills-site.bx-shef.by_location
docker exec nginx-proxy nginx -s reload
```

`make doctor` показывает, есть ли этот файл.

**Обновления.** Образ пересобирается в GitHub Actions на каждый push в `main`, раз в сутки по
расписанию (подхватывает правки в репозиториях-источниках) и по `repository_dispatch`. Watchtower
ставит `:latest` сам; вручную — `make prod-redeploy`. Откат — `image: ghcr.io/bx-shef/skills-site:sha-<коммит>`
в `docker-compose.prod.yml` и `make prod-up`.

Пересборка сразу после правки в репозитории-источнике (в его workflow, токен с `contents: write`
на `bx-shef/skills-site` — `SITE_DISPATCH_TOKEN`):

```yaml
- run: |
    curl -fsS -X POST -H "Authorization: Bearer ${{ secrets.SITE_DISPATCH_TOKEN }}" \
      -H "Accept: application/vnd.github+json" \
      https://api.github.com/repos/bx-shef/skills-site/dispatches -d '{"event_type":"content-updated"}'
```

## Локально

```bash
npm install
SOURCES_DIR=../  node scripts/sync-content.mjs   # взять склонированные рядом репозитории (или без SOURCES_DIR — клонирует в .sources/)
BXSHEF_CHAT_KEY=… npm run dev                    # http://localhost:3000, чат работает в dev
```

Или из Docker: `make build-local` (контент тянется из GitHub, ~3–5 мин).

## Чат

`server/api/assistant.post.ts` (AI SDK, OpenAI-совместимый провайдер): из `llms-full.txt` под
вопрос подбираются до 8 страниц (≤ 60 КБ) и кладутся в системный промпт — работает с любой
моделью. «Обсудить с ИИ» делает страницу темой разговора: первый ответ — её пересказ, дальше она
идёт в контекст первой. Окно чата — `HdChatOverlay`; история — в localStorage браузера.

### Модель чата

Одна модель на установку, задаётся окружением при запуске контейнера (`.env` рядом с
`docker-compose.prod.yml`), пересборка не нужна. Читает `server/utils/chat-config.ts`:

| переменная | что | по умолчанию |
|---|---|---|
| `BXSHEF_CHAT_URL` | адрес OpenAI-совместимого API | `https://vibecode.bitrix24.tech/v1` (AI Router Вайбкода) |
| `BXSHEF_CHAT_KEY` | ключ; пусто — чат выключен (503), сайт работает | — |
| `BXSHEF_CHAT_MODEL` | id модели у провайдера | `bitrix/bitrixgpt-5.6-agent` |
| `BXSHEF_CHAT_MODEL_NAME` | как называть модель на сайте («Ответы … могут быть неточны») | по id: BitrixGPT, DeepSeek, Claude, GPT, Qwen, Gemini |

`BXSHEF_EVAL_URL` / `BXSHEF_EVAL_KEY` (переменные `bxshef eval`) — запасные: установки, где ключ
лежит под этими именами, работают. Ключ — только в `.env` или окружении, в репозитории его нет.

BitrixGPT через AI Router:

```bash
BXSHEF_CHAT_URL=https://vibecode.bitrix24.tech/v1
BXSHEF_CHAT_KEY=…
BXSHEF_CHAT_MODEL=bitrix/bitrixgpt-5.6-agent
```

DeepSeek напрямую (id моделей сверить с документацией DeepSeek):

```bash
BXSHEF_CHAT_URL=https://api.deepseek.com/v1
BXSHEF_CHAT_KEY=sk-…
BXSHEF_CHAT_MODEL=deepseek-chat
BXSHEF_CHAT_MODEL_NAME=DeepSeek
```

Если AI Router отдаёт нужную модель тем же ключом — меняется только `BXSHEF_CHAT_MODEL`.
Рассуждения reasoning-моделей (поле `reasoning_content` у `deepseek-reasoner`) провайдер AI SDK
отдаёт отдельным каналом — в чате они в блоке «Размышление», не в ответе.

Проверка после смены модели: `make prod-up && make health` — строка `model <имя>` и `chat 200`;
затем вопрос в чате, ответ на который есть на сайте (например, «Почему ИИ-агент не берёт мой
навык?» — ответ про `description`, правило 2 стандарта).

## Вёрстка

`app/assets/css/tokens.css` — единственное место с цветами и размерами (`--hd-primary`, фон,
ширина колонки меню и текста статьи); у `.dark` свои значения, тема переключается
`useColorMode` Bitrix24 UI. Порядок стилей: tokens → layout → content → components.

Главная: первый экран с ИИ-поиском, плитки тем (CSS-градиенты с иконкой), промо-карточки,
«Решение найдётся всегда», «Самые читаемые статьи». «Все темы» и поиск строятся из навигации
Nuxt Content; поиск по разделам — `queryCollectionSearchSections`, чат — `/api/assistant`.

UI-база — `@bitrix24/b24ui-nuxt`. Шрифты — Geologica (текст, variable woff2 по подмножествам,
`@fontsource-variable/geologica`) и GetVoIP Grotesque (заголовки, CC BY-ND 3.0 — файл без
изменений, лицензия в `public/fonts/getvoip-grotesque/`). Иконки — `@bitrix24/b24icons-vue`
через `HdIcon` (короткие имена → компоненты, список в самом файле).

Проверки вёрстки в CI: `scripts/check-mobile-width.mjs` — ни одна страница не шире 360 px;
`scripts/check-code-contrast.mjs` — цвета в блоках кода не ниже 4.5:1 в обеих темах.

## Что не хранится в репозитории

Тексты навыков, стандарта и документации модулей — они в своих репозиториях; `content/`
(кроме `index.md`) и `public/llms-full.txt` пересобираются. Ключ — только в `.env`.
