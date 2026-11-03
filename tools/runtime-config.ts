import { loadEnv, type Plugin } from "vite";

const PREFIX = "APP_";
const FILE = "config.js";

function render(values: Record<string, string>): string {
  return `window.__APP_CONFIG__=${JSON.stringify(values)};\n`;
}

export function runtimeConfig(): Plugin {
  let values: Record<string, string> = {};

  return {
    name: "runtime-config",
    configResolved(config) {
      const dir = typeof config.envDir === "string" ? config.envDir : config.root;
      values = loadEnv(config.mode, dir, PREFIX);
    },
    configureServer(server) {
      server.middlewares.use(`/${FILE}`, (_req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-store");
        res.end(render(values));
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: FILE, source: render({}) });
    },
  };
}
