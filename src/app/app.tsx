import { ArrowUpRightIcon, LayersIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { env } from "@/shared/config/env";
import { useTheme } from "@/shared/lib/theme";
import type { Theme } from "@/shared/lib/theme";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/shared/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

const REPO_URL = "https://github.com/AlexanderMokeichuk/vite-react-fsd-starter";
const AUTHOR_URL = "https://github.com/AlexanderMokeichuk";

const THEMES: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
];

const LINKS = [
  {
    title: "Architecture",
    description: "Feature-Sliced Design. Layer boundaries are enforced by ESLint.",
    href: "https://feature-sliced.design/docs/get-started/overview",
  },
  {
    title: "Components",
    description: "shadcn/ui on Radix, themed with neutral surface tokens.",
    href: "https://ui.shadcn.com/docs/components",
  },
  {
    title: "Data",
    description: "TanStack Query for server state, Zustand for the rest.",
    href: "https://tanstack.com/query/latest/docs/framework/react/overview",
  },
  {
    title: "Tooling",
    description: "Vite, React Compiler, strict TypeScript, lefthook.",
    href: "https://vite.dev/guide/",
  },
];

const STACK = ["React 19", "TypeScript", "Vite", "Tailwind v4", "shadcn/ui", "TanStack", "Zustand"];

function ThemeSwitcher() {
  const theme = useTheme((state) => state.theme);
  const setTheme = useTheme((state) => state.setTheme);

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-card p-0.5 ring-1 ring-foreground/10">
      {THEMES.map(({ value, label, icon: Icon }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant={value === theme ? "default" : "ghost"}
              aria-label={label}
              aria-pressed={value === theme}
              onClick={() => setTheme(value)}
            >
              <Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function App() {
  return (
    <TooltipProvider>
      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LayersIcon className="size-4" />
            </span>
            vite-react-fsd-starter
          </div>
          <ThemeSwitcher />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-12 px-6 py-12">
          <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
            <Badge variant="outline">{env.APP_ENV}</Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              React FSD Starter
            </h1>
            <p className="text-lg text-balance text-muted-foreground">
              Production-ready React 19 and Vite with Feature-Sliced Design, strict types and
              enforced architecture.
            </p>
            <p className="rounded-lg bg-card px-4 py-2.5 text-sm text-muted-foreground ring-1 ring-foreground/10">
              Get started by editing{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
                src/app/app.tsx
              </code>
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <a href={REPO_URL} target="_blank" rel="noreferrer">
                  View on GitHub
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`${REPO_URL}/blob/main/AGENTS.md`} target="_blank" rel="noreferrer">
                  Read the rules
                </a>
              </Button>
            </div>
          </div>

          <div className="grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LINKS.map((link) => (
              <a
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col gap-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10 transition-colors duration-150 ease-out hover:bg-accent"
              >
                <span className="flex items-center justify-between font-medium">
                  {link.title}
                  <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
                <span className="text-sm text-muted-foreground">{link.description}</span>
              </a>
            ))}
          </div>
        </main>

        <footer className="flex flex-col items-center gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {STACK.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <a
            href={AUTHOR_URL}
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-150 ease-out hover:text-foreground"
          >
            Built by Alexander Mokeichuk
          </a>
        </footer>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
