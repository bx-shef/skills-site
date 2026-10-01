# skills-site.bx-shef.by

Сайт методологии bxshef: Nuxt + [Nuxt Content](https://content.nuxt.com) + [Bitrix24 UI](https://github.com/bitrix24/b24ui) в Docker, контент из репозиториев
bx-shef при сборке образа, чат по содержимому сайта через BitrixGPT, `llms.txt` / `llms-full.txt`
для ИИ-агентов. Вёрстка — 1 в 1 с виджетом «Битрикс24 Ответы» (helpdesk.bitrix24.ru/widget2/): сайт открывается внутри Битрикс24.

```
content/index.md               лендинг — единственный текст, который живёт здесь
scripts/sync-content.mjs       клонирует skills-standard, skills, options, problems, insync → content/, public/llms.txt, public/llms-full.txt
server/api/assistant.post.ts   чат: OpenAI-совместимый провайдер (BitrixGPT через AI Router), подбор страниц под вопрос
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

`server/api/assistant.post.ts` (AI SDK, OpenAI-совместимый провайдер): из `llms-full.txt` под
вопрос подбираются до 8 страниц (≤ 60 КБ) и кладутся в системный промпт — работает с любой
моделью. Окно чата — `HdChatOverlay`, как помощник «Битрикс24 Ответы»: приветствие с примерами,
вопрос пузырём справа, ответ с «копировать / нравится / не нравится», при ошибке — ссылка на
«Все темы». Открывается из поиска (Enter / кнопка), карточки «Спросить ИИ-агента» и баннера под
оглавлением; история — в localStorage. Модель и адрес — `BXSHEF_CHAT_MODEL`, `BXSHEF_EVAL_URL`.
Ключ `BXSHEF_EVAL_KEY` — только в `.env` на сервере или в окружении, в файлах репозитория его нет.

Проверено: вопрос «Почему ИИ-агент не берёт мой навык?» → ответ со ссылкой на пункт 2
стандарта, командами `bxshef lint`/`eval` и цифрой из прогона 1.

## Вёрстка

`app/assets/css/tokens.css` — единственное место с цветами и размерами (`--hd-primary`,
фон-градиент, ширина колонки слева, ширина текста статьи); значения сняты computed style с
виджета «Битрикс24 Ответы». Разметка главной повторяет его блоки: первый экран с ИИ-поиском,
плитки тем (картинки — CSS-градиенты со «стеклянной» иконкой вместо 3D-картинок оригинала),
промо-карточки, «Решение найдётся всегда», «Самые читаемые статьи»; «Все темы» — как
`allSections.php`. Светлая и тёмная тема (как в Docus): `useColorMode` Bitrix24 UI, все цвета — токены в `tokens.css`, у `.dark` свои значения. UI-база — `@bitrix24/b24ui-nuxt` (Nuxt UI и Docus убраны),
шрифты — Geologica (текст, variable woff2 по подмножествам, `@fontsource-variable/geologica`) и GetVoIP Grotesque (заголовки, CC BY-ND 3.0 — файл без изменений, лицензия в `public/fonts/getvoip-grotesque/`), иконки — `@bitrix24/b24icons-vue` через `HdIcon` (короткие имена → компоненты, список в самом файле). Поиск по разделам —
`queryCollectionSearchSections`, чат — `/api/assistant`.

## Что не хранится в репозитории

Тексты навыков, стандарта и документации модулей — они в своих репозиториях; `content/`
(кроме `index.md`) и `public/llms-full.txt` пересобираются. Ключ — только в `.env`.
