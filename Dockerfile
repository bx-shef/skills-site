# skills-site.bx-shef.by — Nuxt + Nuxt Content + Bitrix24 UI, чат по контенту через BitrixGPT.
# Контент подтягивается из репозиториев bx-shef при сборке образа: второй копии текстов нет.
FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG SITE_URL=https://skills-site.bx-shef.by
ENV SITE_URL=$SITE_URL
RUN node scripts/sync-content.mjs && npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 NITRO_PORT=3000 NITRO_HOST=0.0.0.0
# Nuxt Content при старте пишет SQLite в .output/server/contents.sqlite — каталог должен
# принадлежать пользователю node, иначе база пуста и все страницы контента отдают 404.
COPY --from=build --chown=node:node /app/.output ./.output
EXPOSE 3000
LABEL org.opencontainers.image.source=https://github.com/bx-shef/skills-site
USER node
CMD ["node", ".output/server/index.mjs"]
