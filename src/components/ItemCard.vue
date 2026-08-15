<template>
  <article class="item-card" :class="[selected ? 'is-selected' : '', noteClass]" tabindex="0" @click="$emit('select')" @keydown.enter.prevent="$emit('select')" @keydown.space.prevent="$emit('select')">
    <div class="item-icon" :class="meta.className"><Icon :name="meta.icon" /></div>
    <div class="item-main"><div class="item-meta"><span class="item-kind" :class="meta.className">{{ meta.label }}</span><i class="meta-dot"></i><span class="item-time">{{ item.timeLabel || "剛剛" }}</span></div><h3>{{ item.title || "未命名內容" }}</h3><p class="item-preview" :class="{ 'code-preview': item.type === 'code' }">{{ preview }}</p><div class="item-footer"><span class="item-device"><Icon name="device" />{{ item.device || "此裝置" }}</span><span class="item-tags"><span v-for="(tag, index) in (item.tags || []).slice(0, 2)" :key="tag" class="tag" :class="index === 1 ? (item.type === 'note' ? 'lavender' : 'sage') : ''">{{ tag }}</span></span></div></div>
    <div class="item-actions"><button class="card-action" :class="{ 'is-pinned': item.pinned }" type="button" :aria-label="item.pinned ? '取消釘選' : '釘選'" :title="item.pinned ? '取消釘選' : '釘選'" @click.stop="$emit('pin')"><Icon name="pin" /></button><button class="card-action" type="button" aria-label="複製內容" title="複製內容" @click.stop="$emit('copy')"><Icon name="copy" /></button></div>
  </article>
</template>

<script setup>
import { computed } from "vue";

import Icon from "./Icon.vue";
import { selectedItem, typeMeta } from "../stow";

const props = defineProps({ item: { type: Object, required: true } });
defineEmits(["select", "copy", "pin"]);
const meta = computed(() => typeMeta(props.item.type));
const selected = computed(() => selectedItem.value?.id === props.item.id);
const noteClass = computed(() => props.item.type === "note" ? "is-note" : props.item.type === "link" ? "is-link" : props.item.type === "code" ? "is-code" : "");
const preview = computed(() => props.item.type === "code" ? props.item.content : String(props.item.content || "").replace(/\s+/g, " ").trim());
</script>
