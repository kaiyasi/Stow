<template>
  <LandingView v-if="!state.authenticated" />
  <WorkspaceView v-else />
  <WorkspaceModals />
  <PasswordResetDialog />
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";

import PasswordResetDialog from "../components/PasswordResetDialog.vue";
import WorkspaceModals from "../components/WorkspaceModals.vue";
import LandingView from "../components/LandingView.vue";
import { bootstrap, loadShare, state } from "../stow";
import WorkspaceView from "./WorkspaceView.vue";

const route = useRoute();

onMounted(async () => {
  await bootstrap();
  if (route.query.share) await loadShare(route.query.share);
});
</script>
