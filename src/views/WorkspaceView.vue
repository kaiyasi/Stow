<template>
  <div class="app-shell">
    <aside class="sidebar" :class="{ 'is-open': state.mobileMenu }">
      <div class="sidebar-top">
        <a class="brand" href="/" aria-label="STOW 首頁"><span class="brand-mark"><Icon name="mark" /></span><span class="brand-copy"><strong>STOW</strong><small>keep the useful bits</small></span></a>
        <button class="space-switcher" type="button" aria-label="帳號資訊" @click="openModal('account')"><span class="avatar avatar-sage">{{ avatar }}</span><span><strong>{{ state.user?.handle || "STOW" }}</strong><small>Personal file</small></span><span class="switcher-caret">⌄</span></button>
      </div>
      <nav class="sidebar-nav" aria-label="主要導覽">
        <p class="nav-label">LIBRARY</p>
        <button v-for="item in navigation" :key="item.filter" class="nav-item" :class="{ 'is-active': state.filter === item.filter }" type="button" @click="selectFilter(item.filter)"><Icon :name="item.icon" /><span>{{ item.label }}</span><b v-if="item.count">{{ counts[item.filter] }}</b></button>
        <p class="nav-label nav-label-spaced">COLLECTIONS</p>
        <button v-for="item in collections" :key="item.filter" class="collection-item" type="button" @click="selectFilter(item.filter)"><i class="collection-dot" :class="item.dot"></i><span>{{ item.label }}</span><b>{{ counts[item.filter] }}</b></button>
        <button class="add-collection" type="button" @click="showToast('分類功能會在下一版加入')"><span>＋</span> 新增分類</button>
      </nav>
      <div class="sidebar-bottom"><div class="sync-mini"><div class="sync-mini-icon"><Icon name="cloud" /></div><div><strong>已同步</strong><small>{{ state.items.length }} 則內容 · 剛剛</small></div><span class="live-dot"></span></div><button class="sidebar-action" type="button" @click="openModal('shortcuts')"><Icon name="keyboard" /><span>快捷鍵</span><kbd>?</kbd></button><button class="sidebar-action" type="button" @click="openModal('account')"><Icon name="settings" /><span>設定</span></button><div class="sidebar-user"><span class="avatar avatar-coral">{{ avatar }}</span><span><strong>{{ state.user?.handle }}</strong><small>免費方案</small></span><button type="button" aria-label="登出" @click="logout"><Icon name="more" /></button></div></div>
    </aside>

    <main class="main-content" id="mainContent">
      <header class="topbar">
        <div class="topbar-left"><button class="mobile-menu" type="button" aria-label="開啟導覽" @click="state.mobileMenu = !state.mobileMenu"><Icon name="menu" /></button><a class="topbar-brand" href="/" aria-label="STOW 首頁"><span class="topbar-brand-mark"><i></i><i></i><i></i></span><strong>STOW</strong><small>Clipboard</small></a><span class="topbar-issue">VOL.01 / PERSONAL FILE</span><button class="account-chip is-authenticated" type="button" aria-haspopup="dialog" @click="openModal('account')"><span class="account-chip-mark"><Icon name="check" /></span><span class="account-chip-copy"><strong>{{ state.user?.handle }}</strong><small>SYNC READY</small></span></button></div>
        <div class="topbar-actions"><button class="utility-button" type="button" aria-label="立即同步" title="立即同步" :class="{ 'is-spinning': syncing }" @click="sync"><span class="utility-icon"><Icon name="refresh" /></span><span class="utility-copy"><strong>SYNC</strong><small>3 DEVICES</small></span></button><button class="utility-button" type="button" aria-label="開啟快捷鍵" title="開啟快捷鍵" @click="openModal('shortcuts')"><span class="utility-icon"><Icon name="keyboard" /></span><span class="utility-copy"><strong>KEYS</strong><small>SHORTCUTS</small></span></button><button class="utility-button theme-toggle" type="button" aria-label="切換主題" title="切換主題" @click="toggleTheme"><span class="utility-icon"><span class="theme-sun">☼</span><span class="theme-moon">◐</span></span><span class="utility-copy"><strong>MODE</strong><small>LIGHT / DARK</small></span></button></div>
      </header>

      <div class="content-wrap" @click="state.mobileMenu = false">
        <section class="page-heading"><div><p class="eyebrow">GLOBAL CLIPBOARD / PERSONAL FILE <span class="eyebrow-line"></span></p><h1><span>STOW</span><span class="outline-word">SPACE</span> <span class="title-count">{{ counts.all }}</span></h1><p class="page-intro">跨裝置保存文字、連結與想法；內容預設只屬於你，需要時再產生受控的分享連結。</p></div><div class="heading-side-note"><span class="heading-spark"><Icon name="spark" /></span><p><strong><i></i> SYNC SIGNAL / ONLINE</strong><small>3 台裝置 · 最後同步於剛剛</small></p></div></section>

        <section class="capture-card" aria-labelledby="captureHeading"><div class="capture-watermark">STOW</div><div class="capture-header"><div class="capture-title"><span class="capture-icon"><Icon name="spark" /></span><div><p class="section-kicker">QUICK CAPTURE</p><h2 id="captureHeading">先放進來，之後再整理。</h2></div></div></div><div class="capture-mode" role="tablist" aria-label="新增類型"><button class="mode-button" :class="{ 'is-active': state.captureMode === 'clip' }" type="button" role="tab" :aria-selected="state.captureMode === 'clip'" @click="state.captureMode = 'clip'"><Icon name="copy" />剪貼內容</button><button class="mode-button" :class="{ 'is-active': state.captureMode === 'note' }" type="button" role="tab" :aria-selected="state.captureMode === 'note'" @click="state.captureMode = 'note'"><Icon name="note" />寫一則記事</button></div><form class="capture-fields" @submit.prevent="save"><input v-if="state.captureMode === 'note'" v-model="state.captureDraft.title" class="capture-title-input" type="text" placeholder="記事標題（可留白）" aria-label="記事標題" /><textarea id="entryContent" v-model="state.captureDraft.content" rows="3" placeholder="貼上任何內容⋯ 文字、連結、程式碼，或一個突然想到的點子。" aria-label="要保存的內容" @keydown="captureKeydown"></textarea><div class="capture-footer"><div class="capture-tools"><label class="capture-tag-input"><Icon name="tag" /><input v-model="state.captureDraft.tags" type="text" placeholder="加上標籤" aria-label="標籤，使用逗號分隔" /></label></div><div class="capture-footer-right"><span class="capture-hint"><kbd>SUPER</kbd><span class="shortcut-plus">+</span><kbd>ENTER</kbd><span>儲存</span></span><span class="char-count">{{ state.captureDraft.content.length.toLocaleString('zh-TW') }} 字</span><button class="save-button" type="submit"><span>{{ state.editingId ? '更新內容' : '儲存內容' }}</span><Icon name="arrow" /></button></div></div></form></section>

        <section class="library-toolbar" aria-label="內容篩選"><div class="toolbar-caption"><span class="section-kicker">INDEX / ALL SAVED ITEMS</span><small>搜尋任何文字、連結或標籤</small></div><div class="toolbar-right"><label class="search-field"><Icon name="search" /><input v-model="state.query" type="search" placeholder="搜尋內容、標籤⋯" autocomplete="off" @input="onSearch" /><kbd>/</kbd></label><span class="toolbar-divider"></span><button class="sort-button" type="button" @click="toggleSort"><Icon name="clock" /><span>排序</span><b>⌄</b></button><button class="view-button" :class="{ 'is-active': !state.gridView }" type="button" aria-label="列表檢視" @click="state.gridView = false"><span></span><span></span><span></span></button><button class="view-button" :class="{ 'is-active': state.gridView }" type="button" aria-label="網格檢視" @click="state.gridView = true"><i></i><i></i><i></i><i></i></button></div></section>

        <div class="library-layout"><section class="feed-section" aria-labelledby="feedHeading"><div class="feed-heading"><div><p class="section-kicker">YOUR LIBRARY</p><h2 id="feedHeading">最近收進來的東西 <span>{{ filteredItems.length }}</span></h2></div><button v-if="state.query" class="text-button" type="button" @click="clearSearch">清除搜尋 <Icon name="close" /></button></div><div v-if="filteredItems.length" class="item-list" :class="{ 'grid-view': state.gridView }" aria-live="polite"><ItemCard v-for="item in visibleItems" :key="item.id" :item="item" @select="state.selectedId = item.id" @copy="copyItem(item)" @pin="togglePin(item)" /></div><div v-else class="empty-state"><span class="empty-icon"><Icon name="search" /></span><h3>還沒有找到內容</h3><p>試試別的關鍵字，或把第一段文字貼進上方。</p><button class="secondary-button" type="button" @click="selectFilter('all')">回到全部內容</button></div><div class="feed-footer"><span>已顯示 <strong>{{ visibleItems.length }}</strong> 則內容</span><button v-if="visibleItems.length < filteredItems.length" class="load-more" type="button" @click="state.visible += 4">載入更多 <Icon name="arrow" /></button></div></section><DetailPanel :item="selectedItem" @close="state.selectedId = null" @copy="copyItem(selectedItem)" @share="openShare(selectedItem)" @pin="togglePin(selectedItem)" @edit="editItem(selectedItem)" @delete="deleteItem(selectedItem)" /></div>
      </div>
    </main>
    <div class="mobile-overlay" :class="{ 'is-visible': state.mobileMenu }" @click="state.mobileMenu = false"></div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import Icon from "../components/Icon.vue";
import DetailPanel from "../components/DetailPanel.vue";
import ItemCard from "../components/ItemCard.vue";
import { counts, deleteItem, editItem, filteredItems, openModal, selectedItem, setFilter, setTheme, showToast, state, togglePin, copyItem, refreshItems, saveCapture, setQuery, showApiError, logout as logoutUser } from "../stow";

const visibleItems = computed(() => filteredItems.value.slice(0, state.visible));
const avatar = computed(() => (state.user?.handle || "S").slice(0, 1).toUpperCase());
const syncing = ref(false);
const navigation = [{ filter: "all", icon: "grid", label: "全部內容", count: true }, { filter: "notes", icon: "note", label: "我的記事", count: true }, { filter: "pinned", icon: "pin", label: "釘選項目", count: true }, { filter: "recent", icon: "clock", label: "最近使用", count: false }];
const collections = [{ filter: "work", label: "工作靈感", dot: "dot-coral" }, { filter: "personal", label: "生活備忘", dot: "dot-lavender" }, { filter: "read-later", label: "稍後閱讀", dot: "dot-sage" }];

function selectFilter(filter) { setFilter(filter); }
function onSearch(event) { setQuery(event.target.value); }
function clearSearch() { setQuery(""); }
function toggleSort() { state.sort = state.sort === "recent" ? "oldest" : "recent"; }
function toggleTheme() { setTheme(state.theme === "dark" ? "light" : "dark"); }
async function save() { await saveCapture(); }
function captureKeydown(event) {
  const superKey = event.metaKey || event.ctrlKey || event.getModifierState?.("OS") || event.getModifierState?.("Super");
  if (superKey && event.key === "Enter") { event.preventDefault(); save(); }
}
async function sync() {
  if (syncing.value) return;
  syncing.value = true;
  try { await refreshItems(); window.setTimeout(() => showToast(`已完成同步 · ${state.items.length} 則內容`), 450); } catch (error) { showApiError(error, "同步失敗，請稍後再試"); } finally { window.setTimeout(() => { syncing.value = false; }, 450); }
}
async function logout() { await logoutUser(); showToast("已登出 STOW"); }

function keydown(event) {
  const typing = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
  const superKey = event.metaKey || event.ctrlKey || event.getModifierState?.("OS") || event.getModifierState?.("Super");
  if (!typing && event.key === "/") { event.preventDefault(); document.querySelector("#searchInput")?.focus(); }
  if (!typing && event.key.toLowerCase() === "n") { event.preventDefault(); document.querySelector("#entryContent")?.focus(); }
  if (superKey && event.key === "Enter") { event.preventDefault(); save(); }
  if (event.key === "Escape") { state.mobileMenu = false; }
}

onMounted(() => window.addEventListener("keydown", keydown));
onBeforeUnmount(() => window.removeEventListener("keydown", keydown));
</script>
