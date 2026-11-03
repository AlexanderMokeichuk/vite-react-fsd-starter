import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { runtimeConfig } from "./tools/runtime-config.ts";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.API_PROXY_TARGET;

  if (mode === "development" && !target) {
    console.warn("API_PROXY_TARGET is not set: /api and /ws proxy disabled. See .env.example");
  }

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss(), runtimeConfig()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      proxy: target
        ? {
            "/api": { target, changeOrigin: true },
            "/ws": { target, changeOrigin: true, ws: true },
          }
        : undefined,
    },
  };
});
