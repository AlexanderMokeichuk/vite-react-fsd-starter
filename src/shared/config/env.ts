import { z } from "zod";

declare global {
  interface Window {
    readonly __APP_CONFIG__?: Readonly<Record<string, string>>;
  }
}

const schema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("production"),
});

const parsed = schema.safeParse(window.__APP_CONFIG__ ?? {});

if (!parsed.success) {
  throw new Error(`Invalid runtime config:\n${z.prettifyError(parsed.error)}`);
}

export const env = parsed.data;
