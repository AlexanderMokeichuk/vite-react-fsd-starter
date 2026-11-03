import { z } from "zod";
import { create } from "zustand";

const STORAGE_KEY = "theme";
const FALLBACK_THEME = "dark";

const themeSchema = z.enum(["light", "dark", "system"]);

export type Theme = z.infer<typeof themeSchema>;
export type ResolvedTheme = Exclude<Theme, "system">;

interface ThemeState {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function readDefaultTheme(): Theme {
  const parsed = themeSchema.safeParse(document.documentElement.dataset.defaultTheme);
  return parsed.success ? parsed.data : FALLBACK_THEME;
}

function readStoredTheme(): Theme {
  try {
    const parsed = themeSchema.safeParse(localStorage.getItem(STORAGE_KEY));
    return parsed.success ? parsed.data : readDefaultTheme();
  } catch {
    return readDefaultTheme();
  }
}

function storeTheme(theme: Theme): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme !== "system") {
    return theme;
  }
  return darkQuery.matches ? "dark" : "light";
}

function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement;
  const freeze = document.createElement("style");
  freeze.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.append(freeze);

  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;

  requestAnimationFrame(() => requestAnimationFrame(() => freeze.remove()));
}

function syncTheme(theme: Theme): void {
  const resolved = resolveTheme(theme);
  applyTheme(resolved);
  useTheme.setState({ theme, resolved });
}

const initialTheme = readStoredTheme();

export const useTheme = create<ThemeState>()(() => ({
  theme: initialTheme,
  resolved: resolveTheme(initialTheme),
  setTheme: (theme) => {
    storeTheme(theme);
    syncTheme(theme);
  },
}));

darkQuery.addEventListener("change", () => {
  if (useTheme.getState().theme === "system") {
    syncTheme("system");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) {
    return;
  }
  const parsed = themeSchema.safeParse(event.newValue);
  syncTheme(parsed.success ? parsed.data : readDefaultTheme());
});
