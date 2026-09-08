import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// recipe.20fit.id — SPA statis, di-deploy di Railway (serve dist -s).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2020",
    sourcemap: false,
    minify: "esbuild",
  },
});
