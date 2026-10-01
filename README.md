# skills-site.bx-shef.by

Сайт методологии bxshef: [Docus](https://docus.dev) (Nuxt) в Docker, контент из репозиториев
bx-shef при сборке образа, чат по содержимому сайта через BitrixGPT, `llms.txt` / `llms-full.txt`
для ИИ-агентов. Вёрстка — по образцу виджета поддержки Битрикс24 (набор helpdesk-docus-kit).

```
content/index.md               лендинг — единственный текст, который живёт здесь
scripts/sync-content.mjs       клонирует skills-standard, skills, options, problems, insync → content/, public/llms-full.txt
server/api/assistant.post.ts   чат: OpenAI-совместимый провайдер (BitrixGPT через AI Router), подбор страниц под вопрос
app/
  app.vue                      оболочка вместо штатной Docus (без её шапки, подвала и панели ассистента)
  app.config.ts                заголовок, FAQ чата, ссылки
  layouts/helpdesk.vue         макет: шапка с поиском, меню-иконки слева, статья с оглавлением
  components/Hd*.vue           шапка, меню (из навигации контента), поиск по разделам, чат-оверлей, оглавление, крошки
  components/content/          hd-cards / hd-card / hd-faq / hd-faq-item — для markdown лендинга
  assets/css/                  tokens → layout → content → components (порядок важен)
  pages/index.vue              лендинг; pages/[[lang]]/[...slug].vue — страницы документации
content.config.ts              коллекция landing (слой Docus её не заводит, когда есть свой index.vue)
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
umask 077 && $EDITOR .env        # DOMAIN, LETSENCRYPT_EMAIL, BXSHEF_EVAL_KEY
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
BXSHEF_EVAL_KEY=… npm run dev                    # http://localhost:3000, чат работает в dev
```

Или из Docker: `make build-local` (контент тянется из GitHub, ~3–5 мин).

## Чат

Свой обработчик `server/api/assistant.post.ts` на `apiPath` встроенного ассистента Docus
(`docus.assistant.enabled: true`); штатная панель Docus не рендерится — чат живёт в
`HdChatOverlay` (оверлей поверх страницы, открывается из меню и из поиска по «→» / Enter),
история — в localStorage. Режим `context` (по умолчанию): из `llms-full.txt` под вопрос
подбираются до 8 страниц (≤ 60 КБ) и кладутся в системный промпт — работает с любой моделью.
Режим `mcp`: поиск по документации инструментами встроенного MCP-сервера Docus (`/mcp`) — для
моделей с tool calling. Модель и адрес — `BXSHEF_CHAT_MODEL`, `BXSHEF_EVAL_URL`. Ключ — только
в `.env` на сервере или в окружении, в файлах репозитория его нет.

Проверено: вопрос «Почему ИИ-агент не берёт мой навык?» → ответ со ссылкой на пункт 2
стандарта, командами `bxshef lint`/`eval` и цифрой из прогона 1.

## Вёрстка

`app/assets/css/tokens.css` — единственное место с цветами и размерами (`--hd-primary`,
ширина меню, ширина текста статьи); значения сняты с виджета поддержки Битрикс24, откуда каждое —
в наборе helpdesk-docus-kit (`PARAMETERS.md`). Добавлено к набору: тёмная тема через
`--hd-text-heading`, меню из навигации контента, поиск по разделам
(`queryCollectionSearchSections`), чат на `/api/assistant`, компоненты карточек и FAQ для markdown.

## Что не хранится в репозитории

Тексты навыков, стандарта и документации модулей — они в своих репозиториях; `content/`
(кроме `index.md`) и `public/llms-full.txt` пересобираются. Ключ — только в `.env`.
