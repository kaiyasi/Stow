<template>
  <SvgSprite />
  <RouterView />
  <div class="toast" :class="{ 'is-visible': state.toast.visible }" role="status" aria-live="polite">
    <span class="toast-icon"><Icon name="check" /></span>
    <span>{{ state.toast.message }}</span>
  </div>
</template>

<script setup>
import { onMounted, watch } from "vue";

import Icon from "./components/Icon.vue";
import SvgSprite from "./components/SvgSprite.vue";
import { state } from "./stow";

watch(() => state.theme, (theme) => { document.body.dataset.theme = theme; }, { immediate: true });

onMounted(() => {
  document.title = "STOW — 跨裝置剪貼簿";
});
</script>
