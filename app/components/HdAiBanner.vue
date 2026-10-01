<!-- Баннер под оглавлением, как «Используйте AI-поиск» в «Битрикс24 Ответы»: открывает чат -->
<template>
  <div class="hd-ai-banner">
    <p class="hd-ai-banner-kicker">Используйте</p>
    <p class="hd-ai-banner-title">ИИ-поиск</p>
    <p class="hd-ai-banner-text">быстрые и точные ответы по навыкам и модулям</p>
    <div class="hd-ai-banner-art" aria-hidden="true">
      <span class="hd-ai-banner-bar" />
      <HdStar class="hd-ai-banner-star" />
    </div>
    <button class="hd-ai-banner-btn" type="button" @click="openChat()">Попробовать</button>
  </div>
</template>

<script setup lang="ts">
const { openChat } = useHdChat()
</script>

<style scoped>
.hd-ai-banner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  padding: 18px 14px 14px;
  border-radius: 18px;
  overflow: hidden;
  text-align: center;
  color: #fff;
  background: linear-gradient(170deg, #4fb7ff 0%, #4d7dff 45%, #b67cff 80%, #ff9ec6 100%);
}
.hd-ai-banner p { margin: 0; }
.hd-ai-banner-kicker { font-size: 11px; line-height: 14px; opacity: .9; }
.hd-ai-banner-title { font-size: 20px; line-height: 26px; font-weight: 700; }
.hd-ai-banner-text { font-size: 11px; line-height: 14px; opacity: .9; }
.hd-ai-banner-art { position: relative; width: 100%; height: 76px; margin: 10px 0 8px; }
.hd-ai-banner-bar {
  position: absolute;
  left: 30px; right: 6px; top: 24px;
  height: 30px;
  border-radius: 10px;
  background: rgba(255, 255, 255, .45);
  border: 1px solid rgba(255, 255, 255, .7);
  transform: rotate(-8deg);
}
.hd-ai-banner-star { position: absolute; left: 6px; top: 6px; width: 64px; height: 64px; filter: drop-shadow(0 6px 10px rgba(60, 40, 160, .35)); }
.hd-ai-banner-btn {
  align-self: flex-end;
  height: 28px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--hd-primary);
  cursor: pointer;
}
.hd-ai-banner-btn:hover { background: #eef6ff; }
</style>
