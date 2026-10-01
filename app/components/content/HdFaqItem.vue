<template>
  <details class="hd-faq-item">
    <summary>{{ q }}</summary>
    <div class="hd-faq-answer"><slot /></div>
  </details>
</template>
<script setup lang="ts">
defineProps({ q: { type: String, required: true } })
</script>
<style scoped>
.hd-faq-answer :deep(p:last-child) { margin-bottom: 0; }
</style>
