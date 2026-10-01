<!-- Разноцветная звезда ИИ-поиска — значок поля поиска и аватар чата -->
<template>
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <defs>
      <linearGradient :id="`${uid}-a`" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#27c6ff" />
        <stop offset=".45" stop-color="#3d6bff" />
        <stop offset=".75" stop-color="#b44dff" />
        <stop offset="1" stop-color="#ff7a59" />
      </linearGradient>
      <linearGradient :id="`${uid}-b`" x1="18" y1="4" x2="28" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffd25a" />
        <stop offset="1" stop-color="#ff8a3d" />
      </linearGradient>
    </defs>
    <path :fill="`url(#${uid}-a)`" d="M14 5.5c.5 0 .9.3 1 .8l1 4.2a6 6 0 0 0 4.4 4.4l4.2 1c1 .3 1 1.7 0 2l-4.2 1a6 6 0 0 0-4.4 4.4l-1 4.2c-.3 1-1.7 1-2 0l-1-4.2a6 6 0 0 0-4.4-4.4l-4.2-1c-1-.3-1-1.7 0-2l4.2-1A6 6 0 0 0 12 10.5l1-4.2c.1-.5.5-.8 1-.8Z" />
    <path :fill="`url(#${uid}-b)`" d="M24.5 3c.3 0 .5.2.6.5l.4 1.6c.2.8.8 1.4 1.6 1.6l1.6.4c.6.2.6 1 0 1.2l-1.6.4c-.8.2-1.4.8-1.6 1.6l-.4 1.6c-.2.6-1 .6-1.2 0l-.4-1.6c-.2-.8-.8-1.4-1.6-1.6l-1.6-.4c-.6-.2-.6-1 0-1.2l1.6-.4c.8-.2 1.4-.8 1.6-1.6l.4-1.6c.1-.3.3-.5.6-.5Z" />
  </svg>
</template>

<script setup lang="ts">
const uid = `hd-star-${useId()}`
</script>
