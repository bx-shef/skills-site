---
title: bxshef — навыки ИИ-агентов для Битрикса
seo:
  title: bxshef — навыки ИИ-агентов для Битрикса
  description: Методология и проверка навыков ИИ-агентов для коробочного Битрикс24 и БУС; навыки к модулям shef.*
---

# Навыки ИИ-агентов для Битрикса — проверяемые

ИИ-агент пишет код в коробочном Битрикс24 и БУС по канону модуля, а не по догадкам. Здесь — правила, по которым навык пишется, и проверка, что ему можно верить: `lint`, `eval`, стенд.

::hd-cards
  :::hd-card{title="Стандарт навыка" to="/methodology/standard" icon="i-lucide-ruler"}
  11 правил. Каждое выведено из провала на стенде, а не из соображений.
  :::

  :::hd-card{title="bxshef: lint · eval · feedback" to="/methodology/bxshef" icon="i-lucide-shield-check"}
  Форма и классы против кода; выбор навыка моделью по фразе; отзывы ИИ-агентов после задач.
  :::

  :::hd-card{title="Навыки shef.*" to="/skills" icon="i-lucide-sparkles" blue}
  Навыки к модулям shef.options, shef.problems, shef.insync по этому стандарту — `npx skills add bx-shef/skills`.
  :::
::

## С чего начать

Автору модуля для коробки Битрикс24 или Битрикс: Управление сайтом:

1. Прочитать [стандарт](/methodology/standard) — 11 правил на одну страницу.
2. Взять [заготовку репозитория](/methodology/template) и написать первый навык.
3. Проверить: `npx bxshef lint --dir .agents/skills --code <исходники модуля>`, затем `eval` — [как это устроено](/methodology/method).
4. В CI — готовый [GitHub Action](/methodology/action) `bx-shef/skills-standard/action@v1`.

Пользователю ваших навыков достаточно `npx skills add <owner>/<repo>` — установщик [skills](https://github.com/vercel-labs/skills), своего здесь нет.

## Частые вопросы

::hd-faq
  :::hd-faq-item{q="Что такое навык?"}
  Папка со `SKILL.md` по открытому стандарту [Agent Skills](https://agentskills.io). ИИ-агент (Claude Code, Codex, Cursor и другие) читает описание, сам берёт нужный навык под задачу и делает по канону модуля — с точными namespace, сигнатурами и ловушками, которых в обучающих данных модели нет.
  :::

  :::hd-faq-item{q="Почему ИИ-агент не берёт мой навык?"}
  Почти всегда — из-за `description`: он написан под содержание, а не под задачу, или привязан к вендору. Правило 2 стандарта и `bxshef eval` — он проверяет именно выбор навыка по фразе.
  :::

  :::hd-faq-item{q="Это платно?"}
  Нет. Методология, `bxshef`, Action и навыки shef.* — MIT. Проект некоммерческий: цель в том, чтобы методологию взяли.
  :::

  :::hd-faq-item{q="Куда уходят отзывы ИИ-агентов?"}
  Навык `shef-feedback` в конце задачи записывает, что пригодилось и чего не хватило, в `.bxshef/feedback/` проекта и отправляет на адрес из `.bxshef.json`. Свой приёмник — [feedback/](/methodology/feedback), Docker без зависимостей.
  :::
::

Весь сайт одним файлом для ИИ-агентов — [llms.txt](/llms.txt) и [llms-full.txt](/llms-full.txt). Вопросы по сайту — ИИ-агенту в меню слева.
