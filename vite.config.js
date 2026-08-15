import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  publicDir: "assets",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
