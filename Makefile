# Сайт skills-site.bx-shef.by. Один Makefile на два места: корень репозитория и /home/bitrix/skills-site/
# на сервере, где лежат только docker-compose.prod.yml, этот Makefile и .env (README.md, «Сервер»).
# Схема — как у приёмника отзывов (skills-standard/feedback): общий nginx-proxy + acme-companion
# и Watchtower на хосте, образ из ghcr.io.

.DEFAULT_GOAL := help
.PHONY: help build-local prod-up prod-down prod-pull prod-redeploy logs ps health doctor self-update

# Прод-переменные — только из .env: чужой экспортированный DOMAIN на общем хосте не должен
# подменить домен сайта. COMPOSE_PROJECT_NAME / COMPOSE_FILE из окружения хоста тоже снимаем.
override COMPOSE_ENV = env -u DOMAIN -u LETSENCRYPT_EMAIL -u BXSHEF_EVAL_KEY -u BXSHEF_EVAL_URL \
	-u BXSHEF_CHAT_MODEL -u ASSISTANT_MODE -u COMPOSE_PROJECT_NAME -u COMPOSE_FILE docker compose
override COMPOSE = $(COMPOSE_ENV) -f docker-compose.prod.yml
override CONTAINER := skills-site
override RAW := https://raw.githubusercontent.com/bx-shef/skills-site/main
override IMAGE_SOURCE := https://github.com/bx-shef/skills-site

# ─── Локально (в корне репозитория) ──────────────────────────────────

## Собрать из исходников и запустить на 127.0.0.1:3000 (контент тянется из GitHub, ~3–5 мин)
build-local:
	docker compose up --build

# ─── Прод (на сервере) ───────────────────────────────────────────────

## Запустить / обновить контейнер
prod-up:
	$(COMPOSE) up -d

## Остановить
prod-down:
	$(COMPOSE) down

## Скачать свежий образ, не перезапуская контейнер
prod-pull:
	$(COMPOSE) pull

## Обновить прямо сейчас, не дожидаясь Watchtower (чистит только свои старые образы)
prod-redeploy:
	$(COMPOSE) pull && $(COMPOSE) up -d && \
	docker image prune -f --filter "label=org.opencontainers.image.source=$(IMAGE_SOURCE)"

## Живой лог (Ctrl+C — выйти)
logs:
	$(COMPOSE) logs -f site

## Состояние контейнера
ps:
	$(COMPOSE) ps

## Проверка изнутри сети proxy-net: сайт и чат отвечают
health:
	@for i in $$(seq 1 30); do docker exec $(CONTAINER) node -e "fetch('http://127.0.0.1:3000/llms.txt').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))" 2>/dev/null && break; sleep 1; done  # сразу после prod-up сайт ещё стартует
	docker exec $(CONTAINER) node -e "fetch('http://127.0.0.1:3000/llms.txt').then(r => { console.log('site', r.status); process.exit(r.ok ? 0 : 1) })"
	docker exec $(CONTAINER) node -e "fetch('http://127.0.0.1:3000/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', parts: [{ type: 'text', text: 'ping' }] }] }) }).then(r => { console.log('chat', r.status, r.status === 503 ? '(BXSHEF_EVAL_KEY не задан)' : ''); process.exit(r.status < 500 || r.status === 503 ? 0 : 1) })"

## Что не так: сеть, прокси, Watchtower, .env, сертификат
doctor:
	@docker network inspect proxy-net >/dev/null 2>&1 && echo "[ok] сеть proxy-net" || echo "[!!] нет сети proxy-net — поднять nginx-proxy"
	@docker ps --format '{{.Names}}' | grep -qx nginx-proxy && echo "[ok] nginx-proxy" || echo "[!!] контейнер nginx-proxy не запущен"
	@docker ps --format '{{.Names}}' | grep -qi watchtower && echo "[ok] watchtower" || echo "[..] watchtower не найден — обновлять через make prod-redeploy"
	@test -f .env && echo "[ok] .env" || echo "[!!] нет .env — cp .env.example .env"
	@grep -q '^BXSHEF_EVAL_KEY=.\+' .env 2>/dev/null && echo "[ok] ключ чата задан" || echo "[..] BXSHEF_EVAL_KEY пуст — чат ответит 503"
	@V=$$(docker inspect nginx-proxy --format '{{range .Mounts}}{{if eq .Destination "/etc/nginx/vhost.d"}}{{.Source}}{{end}}{{end}}' 2>/dev/null); \
	  D=$$(grep -E '^DOMAIN=' .env 2>/dev/null | cut -d= -f2); \
	  if [ -n "$$V" ] && [ -f "$$V/$${D}_location" ]; then echo "[ok] vhost.d/$${D}_location (proxy_buffering off — чат стримит)"; \
	  else echo "[..] нет vhost.d/$${D}_location — чат ответит одним куском; см. README «Сервер»"; fi
	@$(COMPOSE) ps --format '{{.Name}} {{.Status}}' 2>/dev/null || true

## Обновить docker-compose.prod.yml и Makefile из main репозитория (для каталога на сервере)
self-update:
	curl -fsSL $(RAW)/docker-compose.prod.yml -o docker-compose.prod.yml.new && mv docker-compose.prod.yml.new docker-compose.prod.yml
	curl -fsSL $(RAW)/Makefile -o Makefile.new && mv Makefile.new Makefile
	@echo "обновлено; make prod-up"

## Эта справка
help:
	@grep -B1 -E '^[a-z-]+:' $(MAKEFILE_LIST) | grep -E '^##|^[a-z-]+:' | sed 's/^## //' | paste - - | awk -F'\t' '{ printf "  %-16s %s\n", $$2, $$1 }' | sed 's/://'
