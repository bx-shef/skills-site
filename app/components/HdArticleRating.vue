<!--
  «Статья помогла?» внизу статьи: 👍 / 👎 → приёмник отзывов (server/api/assistant-feedback,
  kind: 'article'). При 👎 — необязательное поле «чего не хватило». Показывается, только если
  на сервере задан приёмник (BXSHEF_FEEDBACK_URL). Оценка запоминается в браузере по пути страницы.
-->
<template>
  <div v-if="enabled" class="hd-article-rating">
    <template v-if="state === 'done'">
      <span class="hd-article-rating-text">Спасибо, оценка передана авторам сайта</span>
    </template>
    <template v-else-if="state === 'comment'">
      <span class="hd-article-rating-text">Чего не хватило? Необязательно — без имён и ссылок на проекты.</span>
      <B24Textarea v-model="comment" :rows="2" autoresize :maxlength="2000" class="hd-article-rating-input" placeholder="Например: нет примера для агента" />
      <div class="hd-article-rating-actions">
        <B24Button color="air-primary" size="sm" label="Отправить" @click="send(-1)" />
        <B24Button color="air-tertiary" size="sm" label="Без комментария" @click="comment = ''; send(-1)" />
      </div>
    </template>
    <template v-else>
      <span class="hd-article-rating-text">Статья помогла?</span>
      <B24Button color="air-secondary-no-accent" size="sm" :icon="icon('like')" label="Да" @click="send(1)" />
      <B24Button color="air-secondary-no-accent" size="sm" :icon="icon('dislike')" label="Нет" @click="state = 'comment'" />
    </template>
  </div>
</template>

<script setup lang="ts">
const enabled = useChatRatings()
const route = useRoute()
const comment = ref('')
const state = ref<'ask' | 'comment' | 'done'>('ask')
const key = computed(() => `hd-rated:${route.path}`)

onMounted(() => { try { if (localStorage.getItem(key.value)) state.value = 'done' } catch { /* хранилище недоступно */ } })
watch(() => route.path, () => {
  comment.value = ''
  try { state.value = localStorage.getItem(key.value) ? 'done' : 'ask' } catch { state.value = 'ask' }
})

async function send(rating: 1 | -1) {
  state.value = 'done'
  try { localStorage.setItem(key.value, String(rating)) } catch { /* хранилище недоступно */ }
  await $fetch('/api/assistant-feedback', { method: 'POST', body: { kind: 'article', rating, comment: comment.value, page: route.path } })
    .catch(() => { /* не сохранилась у авторов — читателю не мешаем */ })
}
</script>

<style scoped>
.hd-article-rating { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: var(--hd-space-2xl); padding-top: 16px; border-top: 1px solid var(--hd-line); }
.hd-article-rating-text { font-size: var(--hd-size-sm); color: var(--hd-text-secondary); }
.hd-article-rating-input { flex: 1 1 100%; }
.hd-article-rating-actions { display: flex; gap: 8px; }
</style>
