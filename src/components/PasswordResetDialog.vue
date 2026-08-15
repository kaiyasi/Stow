<template>
  <dialog v-if="token" class="share-gate-dialog password-reset-dialog" open>
    <span class="gate-lock"><Icon name="lock" /></span>
    <p class="section-kicker">ACCOUNT RECOVERY / RESET</p>
    <h2>設定新的密碼</h2>
    <p class="share-gate-description">請設定新的密碼；完成後，其他裝置的登入狀態會被撤銷。</p>
    <form @submit.prevent="submit"><label class="auth-field"><span>NEW PASSWORD / 新密碼</span><input v-model="password" type="password" autocomplete="new-password" minlength="12" maxlength="128" required /></label><label class="auth-field"><span>CONFIRM PASSWORD / 確認新密碼</span><input v-model="confirm" type="password" autocomplete="new-password" minlength="12" maxlength="128" required /></label><button class="auth-submit" type="submit"><span>重設密碼</span><Icon name="arrow" /></button></form><p class="auth-footnote">ONE-TIME LINK · 重設連結只能使用一次。</p>
  </dialog>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import Icon from "./Icon.vue";
import { apiErrorMessage } from "../api";
import { confirmPasswordReset, showToast } from "../stow";

const route = useRoute();
const router = useRouter();
const token = route.query.reset;
const password = ref("");
const confirm = ref("");

async function submit() {
  if (password.value !== confirm.value) { showToast("兩次輸入的新密碼不一致"); return; }
  try { await confirmPasswordReset(token, password.value); await router.replace("/login"); } catch (error) { showToast(apiErrorMessage(error, "無法重設密碼")); }
}
</script>
