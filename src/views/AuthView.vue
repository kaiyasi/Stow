<template>
  <main class="auth-entry-page">
    <a class="auth-entry-brand" href="/" aria-label="返回 STOW 首頁">
      <span class="topbar-brand-mark"><i></i><i></i><i></i></span>
      <strong>STOW</strong><small>Clipboard</small>
    </a>

    <div class="auth-entry-card">
      <div class="auth-layout">
        <section class="auth-visual">
          <span class="auth-stamp">STOW / ACCESS PASS</span>
          <span class="auth-visual-index" aria-hidden="true">{{ isRegister ? "01" : "02" }}</span>
          <span class="auth-mark"><Icon name="shield" /></span>
          <div class="auth-visual-copy">
            <p class="section-kicker">YOUR PRIVATE FILE</p>
            <h2>把想留住的東西，<br />帶到每一台裝置。</h2>
            <p>登入後，內容預設只有你看得到。只有你主動產生分享連結，它才會離開這個檔案。</p>
          </div>
          <div class="auth-signal"><i></i><span>ENCRYPTED SYNC / READY</span><b>{{ isRegister ? "01" : "02" }}</b></div>
        </section>

        <form class="auth-form auth-entry-form" name="login" method="post" :action="isRegister ? '/api/auth/register' : '/api/auth/login'" autocomplete="on" @submit.prevent="submit">
          <div class="dialog-header">
            <div><p class="section-kicker">ACCOUNT / {{ isRegister ? "CREATE ACCOUNT" : "SIGN IN" }}</p><h1>{{ isRegister ? "建立你的 STOW" : "登入你的 STOW" }}</h1></div>
            <button class="detail-close" type="button" aria-label="返回介紹頁" @click="router.push('/')"><Icon name="close" /></button>
          </div>
          <p class="auth-intro">{{ isRegister ? "設定帳號名稱與密碼，再留下 Gmail 供日後重設密碼使用。" : "登入後才能啟用跨裝置同步，也能建立只開放給特定對象的分享連結。" }}</p>

          <label class="auth-field"><span>HANDLE / 帳號名稱</span><input v-model="form.handle" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="3" maxlength="32" placeholder="kei" required /></label>
          <label v-if="isRegister" class="auth-field"><span>GMAIL / Gmail 帳號</span><input v-model="form.gmail" name="email" type="email" autocomplete="email" autocapitalize="none" placeholder="name@gmail.com" pattern="^[^\s@]+@gmail\.com$" title="請輸入 Gmail 帳號" required /></label>
          <label class="auth-field"><span>PASSWORD / 密碼</span><input v-model="form.password" name="password" type="password" :autocomplete="isRegister ? 'new-password' : 'current-password'" placeholder="至少 12 個字元" minlength="12" maxlength="128" required /></label>
          <label v-if="isRegister" class="auth-field"><span>CONFIRM PASSWORD / 確認密碼</span><input ref="confirmInput" v-model="form.confirm" name="password_confirmation" type="password" autocomplete="new-password" placeholder="再次輸入密碼" minlength="12" maxlength="128" required /></label>

          <div v-if="isRegister" class="auth-check auth-terms">
            <input id="termsAccepted" v-model="form.termsAccepted" type="checkbox" required />
            <span>我已閱讀並同意 <button class="legal-link" type="button" @click="openLegal('terms')">服務條款</button> 與 <button class="legal-link" type="button" @click="openLegal('privacy')">隱私政策</button></span>
          </div>

          <button class="auth-submit" type="submit"><span>{{ isRegister ? "建立帳號" : "登入 STOW" }}</span><Icon name="arrow" /></button>
          <div class="auth-links-row">
            <p v-if="!isRegister" class="auth-recovery"><span>忘記密碼？</span><button class="auth-link" type="button" @click="resetOpen = true">重設密碼</button></p>
            <span v-if="!isRegister" class="auth-links-divider" aria-hidden="true">·</span>
            <p class="auth-signup"><span>{{ isRegister ? "已經有帳號？" : "還沒有帳號？" }}</span><button class="auth-link" type="button" @click="switchMode">{{ isRegister ? "登入" : "建立帳號" }}</button></p>
          </div>
          <p class="auth-footnote">SECURE SESSION · 登入使用帳號名稱＋密碼；Gmail 僅用於密碼重設。</p>
        </form>
      </div>
    </div>

    <dialog v-if="legalOpen" class="legal-dialog" open @click.self="legalOpen = false">
      <div class="legal-layout">
        <aside class="legal-nav">
          <p class="section-kicker">STOW / LEGAL FILE</p>
          <h2>使用前，先知道我們如何保護你的內容。</h2>
          <div class="legal-tabs" role="tablist" aria-label="法律文件">
            <button v-for="(_, id) in legalDocuments" :key="id" class="legal-tab" :class="{ 'is-active': legalDocument === id }" type="button" role="tab" :aria-selected="legalDocument === id" @click="legalDocument = id">{{ id === 'terms' ? '服務條款' : '隱私政策' }} <span>{{ id === 'terms' ? '01' : '02' }}</span></button>
          </div>
          <small class="legal-nav-note">草案版 · 最後更新 2026.08.15<br />正式上線前會經過法律審閱。</small>
        </aside>
        <section class="legal-body">
          <div class="dialog-header"><div><p class="section-kicker">{{ currentLegal.kicker }}</p><h2>{{ currentLegal.title }}</h2></div><button class="detail-close" type="button" aria-label="關閉文件" @click="legalOpen = false"><Icon name="close" /></button></div>
          <div class="legal-content"><p class="legal-intro">{{ currentLegal.intro }}</p><section v-for="section in currentLegal.sections" :key="section[0]" class="legal-section"><h3>{{ section[0] }}</h3><p>{{ section[1] }}</p></section></div>
          <div class="legal-footer"><span>DOCUMENT / <strong>DRAFT</strong></span><button class="dialog-secondary" type="button" @click="legalOpen = false">返回註冊</button></div>
        </section>
      </div>
    </dialog>

    <dialog v-if="resetOpen" class="share-gate-dialog password-reset-dialog" open @click.self="resetOpen = false">
      <span class="gate-lock"><Icon name="lock" /></span>
      <p class="section-kicker">ACCOUNT RECOVERY / 03</p>
      <h2>找回你的密碼</h2>
      <p class="share-gate-description">輸入註冊時的 Gmail 帳號，我們會寄出密碼重設連結。</p>
      <form @submit.prevent="requestReset"><label class="auth-field"><span>GMAIL / Gmail 帳號</span><input v-model="resetGmail" type="email" autocomplete="email" placeholder="name@gmail.com" pattern="^[^\s@]+@gmail\.com$" required /></label><button class="auth-submit" type="submit"><span>寄送重設連結</span><Icon name="arrow" /></button></form>
      <button class="dialog-secondary" type="button" @click="resetOpen = false">返回登入</button>
      <p class="auth-footnote">SECURE RECOVERY · 連結只使用一次，並會在一小時後失效。</p>
    </dialog>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import Icon from "../components/Icon.vue";
import { apiErrorMessage } from "../api";
import { legalDocuments, login, registerAccount, requestPasswordReset, showToast } from "../stow";

const props = defineProps({ mode: { type: String, default: "login" } });
const route = useRoute();
const router = useRouter();
const isRegister = computed(() => (props.mode || route.path.slice(1)) === "register");
const form = reactive({ handle: "", gmail: "", password: "", confirm: "", termsAccepted: false });
const confirmInput = ref(null);
const legalOpen = ref(false);
const legalDocument = ref("terms");
const resetOpen = ref(false);
const resetGmail = ref("");
const currentLegal = computed(() => legalDocuments[legalDocument.value]);

function switchMode() {
  form.password = "";
  form.confirm = "";
  router.push(isRegister.value ? "/login" : "/register");
}

function openLegal(documentId) {
  legalDocument.value = documentId;
  legalOpen.value = true;
}

async function submit(event) {
  const target = event.currentTarget;
  if (isRegister.value && form.password !== form.confirm) {
    confirmInput.value?.setCustomValidity("兩次輸入的密碼不一致");
  } else {
    confirmInput.value?.setCustomValidity("");
  }
  if (!target.reportValidity()) return;
  if (isRegister.value && !form.termsAccepted) {
    showToast("請勾選並同意服務條款與隱私政策");
    return;
  }
  try {
    if (isRegister.value) {
      await registerAccount(form);
      showToast("帳號已建立 · 請登入 STOW");
      form.password = "";
      form.confirm = "";
      form.termsAccepted = false;
      await router.push("/login");
      return;
    }
    await login(form.handle, form.password);
    showToast("已登入 STOW · 同步已開啟");
    await router.push("/");
  } catch (error) {
    showToast(apiErrorMessage(error, isRegister.value ? "無法建立帳號" : "無法登入 STOW"));
  } finally {
    confirmInput.value?.setCustomValidity("");
  }
}

async function requestReset() {
  try {
    await requestPasswordReset(resetGmail.value);
    resetOpen.value = false;
  } catch (error) {
    showToast(apiErrorMessage(error, "無法寄送重設密碼連結"));
  }
}
</script>
