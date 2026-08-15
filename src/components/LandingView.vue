<template>
  <div class="landing-root">
    <header class="topbar">
      <div class="topbar-left"><a class="topbar-brand" href="/" aria-label="STOW 首頁"><span class="topbar-brand-mark"><i></i><i></i><i></i></span><strong>STOW</strong><small>Clipboard</small></a><span class="topbar-issue">VOL.01 / PERSONAL FILE</span><button class="account-chip" type="button" @click="router.push('/login')"><span class="account-chip-mark"><Icon name="lock" /></span><span class="account-chip-copy"><strong>登入</strong><small>ACCESS / SYNC</small></span></button></div>
      <div class="topbar-actions"><button class="utility-button" type="button" aria-label="登入後同步" @click="router.push('/login')"><span class="utility-icon"><Icon name="refresh" /></span><span class="utility-copy"><strong>SYNC</strong><small>3 DEVICES</small></span></button><button class="utility-button" type="button" aria-label="開啟快捷鍵" @click="showToast('登入後即可使用快捷鍵')"><span class="utility-icon"><Icon name="keyboard" /></span><span class="utility-copy"><strong>KEYS</strong><small>SHORTCUTS</small></span></button><button class="utility-button theme-toggle" type="button" aria-label="切換主題" @click="toggleTheme"><span class="utility-icon"><span class="theme-sun">☼</span><span class="theme-moon">◐</span></span><span class="utility-copy"><strong>MODE</strong><small>LIGHT / DARK</small></span></button></div>
    </header>
    <main class="main-content landing-main">
      <section class="auth-landing" aria-labelledby="landingTitle">
        <div class="auth-landing-frame">
      <div class="landing-topline"><span>STOW / PRIVATE SPACE</span><span>ACCESS 00 / LOCKED</span></div>
      <div class="landing-layout">
        <div class="landing-copy">
          <p class="eyebrow">GLOBAL CLIPBOARD / PERSONAL FILE <span class="eyebrow-line"></span></p>
          <h1 id="landingTitle">把想留住的東西，<span>帶到每一台裝置。</span></h1>
          <p class="landing-intro">STOW 是你的跨裝置剪貼簿與記事空間。貼上文字、收下連結、記住靈感，再從任何一台裝置繼續。</p>
          <div class="landing-actions"><button class="landing-primary" type="button" @click="router.push('/login')">登入 STOW <Icon name="arrow" /></button><button class="landing-secondary" type="button" @click="router.push('/register')">建立帳號</button></div>
          <p class="landing-note"><Icon name="lock" /><span>登入後才能使用工作區；登入狀態會在這台裝置保留一年。</span></p>
        </div>
        <div class="landing-visual" aria-hidden="true">
          <span class="landing-index">00</span>
          <div class="landing-visual-top"><span>WORKSPACE PREVIEW</span><b><i></i> SYNC READY</b></div>
          <div class="landing-board">
            <div class="board-sidebar"><span class="board-logo"><Icon name="mark" /></span><i class="is-active"></i><i></i><i></i><span class="board-sidebar-foot"><Icon name="lock" /></span></div>
            <div class="board-main">
              <div class="board-window-bar"><span class="board-dots"><i></i><i></i><i></i></span><span>PRIVATE FILE / 0315</span><Icon name="cloud" /></div>
              <div class="board-window-body"><span class="board-kicker">QUICK CAPTURE</span><strong>把這一段<br /><em>先留下。</em></strong><div class="board-input-lines"><i></i><i></i><i></i></div><div class="board-tags"><span>NOTE</span><span>PRIVATE</span><span>SYNC</span></div></div>
              <div class="board-items"><div class="board-item"><span class="board-item-icon"><Icon name="note" /></span><div><small>NOTE / JUST NOW</small><b>本週工作節奏</b></div><i>01</i></div><div class="board-item"><span class="board-item-icon is-link"><Icon name="link" /></span><div><small>LINK / 12 MIN AGO</small><b>一篇想慢慢讀的文章</b></div><i>02</i></div></div>
            </div>
          </div>
          <div class="landing-visual-bottom"><span><i></i> PRIVATE BY DEFAULT</span><span>VOL.01 / 3 DEVICES</span></div>
        </div>
      </div>
      <div class="landing-benefits"><div><span>01</span><strong>快速收進來</strong><small>文字、連結、程式碼與記事</small></div><div><span>02</span><strong>跨裝置同步</strong><small>在需要的地方接著使用</small></div><div><span>03</span><strong>自己控制分享</strong><small>內容預設只有你看得到</small></div></div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

import Icon from "./Icon.vue";
import { setTheme, showToast, state } from "../stow";

const router = useRouter();

function toggleTheme() { setTheme(state.theme === "dark" ? "light" : "dark"); }
</script>
