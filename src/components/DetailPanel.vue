<template>
  <aside class="detail-panel" aria-label="內容預覽">
    <div class="detail-top"><div><p class="section-kicker">QUICK LOOK</p><h2>內容預覽</h2></div><button class="detail-close" type="button" aria-label="關閉預覽" @click="$emit('close')"><Icon name="close" /></button></div>
    <div v-if="!item" class="detail-empty"><span class="empty-icon"><Icon name="eye" /></span><strong>挑一則內容看看</strong><p>點擊左側任何卡片，這裡會顯示完整內容與快速操作。</p></div>
    <div v-else class="detail-body"><div class="detail-label" :class="meta.className"><Icon :name="meta.icon" /><span>{{ meta.label }} · {{ item.timeLabel || "剛剛" }}</span></div><h3 class="detail-title">{{ item.title || "未命名內容" }}</h3><p class="detail-copy" :class="{ 'code-copy': item.type === 'code' }">{{ item.content }}</p><span v-if="url" class="detail-url">{{ url }}</span><div class="detail-tags"><span v-for="(tag, index) in (item.tags || [])" :key="tag" class="tag" :class="index % 2 ? 'sage' : ''">{{ tag }}</span><span v-if="!item.tags?.length" class="tag">未分類</span></div><div class="detail-meta"><span><Icon name="device" />{{ item.device || "此裝置" }}</span><span><Icon name="cloud" />已同步</span></div><div class="detail-actions"><button class="detail-copy-button" type="button" @click="$emit('copy')"><Icon name="copy" />複製內容</button><button class="detail-secondary-button" type="button" title="建立分享連結" @click="$emit('share')"><Icon name="link" /></button><button class="detail-secondary-button" type="button" title="編輯" @click="$emit('edit')"><Icon name="note" /></button><button class="detail-secondary-button" :class="{ 'is-pinned': item.pinned }" type="button" :title="item.pinned ? '取消釘選' : '釘選'" @click="$emit('pin')"><Icon name="pin" /></button><button class="detail-secondary-button danger" type="button" title="刪除" @click="$emit('delete')"><Icon name="trash" /></button></div></div>
  </aside>
</template>

<script setup>
import { computed } from "vue";

import Icon from "./Icon.vue";
import { typeMeta } from "../stow";

const props = defineProps({ item: { type: Object, default: null } });
defineEmits(["close", "copy", "share", "pin", "edit", "delete"]);
const meta = computed(() => typeMeta(props.item?.type));
const url = computed(() => /^(https?:\/\/|www\.)/i.test(String(props.item?.content || "").trim()) ? String(props.item.content).trim().split(/\s+/)[0] : "");
</script>
