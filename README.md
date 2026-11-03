# vite-react-fsd-starter

Production-ready React 19 + Vite starter built on **Feature-Sliced Design** with layer boundaries enforced by ESLint, strict TypeScript, React Compiler, Tailwind v4 + shadcn/ui and a Docker image that runs in any environment without a rebuild.

[![CI](https://github.com/AlexanderMokeichuk/vite-react-fsd-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexanderMokeichuk/vite-react-fsd-starter/actions/workflows/ci.yml)
[![License: MIT-0](https://img.shields.io/badge/license-MIT--0-blue.svg)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-buy%20me%20a%20coffee-ff5e5b?logo=ko-fi&logoColor=white)](https://ko-fi.com/alexandermokeichuk)

## Why this one

- **Architecture that defends itself.** Importing a feature from `shared` or reaching into another slice's internals is a lint error, not a code review comment.
- **One Docker image for every environment.** The API is always called on a relative `/api`. In dev Vite proxies it, in the container nginx does. Runtime values come from `APP_*` env vars at container start, nothing is baked into the bundle.
- **Release in one command.** `bun run image` checks lint and types, asks for the next version, builds and pushes the image, then commits and tags the release.
- **UI rules written down.** Neutral surfaces, color as a signal, motion timings. Shared by people and AI agents in [AGENTS.md](AGENTS.md).

## Quick start

```bash
bun create AlexanderMokeichuk/vite-react-fsd-starter my-app
cd my-app
cp .env.example .env.local
bun run dev
```

Or press **Use this template** on GitHub, clone your new repo and run `bun install && bun tools/init-project.ts` to remove the starter's own files.

## Stack

|                   |                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Core              | React 19, TypeScript (strict), Vite 8, Re[![License: MIT](https://img.shields.io/badge/license-MIT--0-blue.svg)](LICENSE) |
| act Compiler, Bun |
| UI                | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, sonner                                                                  |
| State             | TanStack Query for server data, Zustand for client state                                                                  |
| Forms and data    | react-hook-form + zod, TanStack Table, date-fns                                                                           |
| Quality           | ESLint with FSD boundaries, Prettier with import and class sorting, lefthook, commitlint, Vitest                          |
| Delivery          | Docker (Bun build, nginx runtime), GitHub Actions                                                                         |

## Scripts

| Command                     | What it does                                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `bun run dev`               | Dev server with `/api` and `/ws` proxy                                    |
| `bun run build`             | Type check and production build                                           |
| `bun run lint` / `lint:fix` | ESLint, including layer boundaries                                        |
| `bun run format`            | Prettier, sorts imports and Tailwind classes                              |
| `bun run typecheck`         | TypeScript only                                                           |
| `bun run test`              | Vitest                                                                    |
| `bun run image`             | Interactive release: checks, version bump, Docker build and push, git tag |

## Structure

```
src/
  app/        providers, router, layouts, global styles
  pages/      route screens, compose widgets only
  widgets/    large page blocks
  features/   user actions: forms, mutations
  entities/   business objects: types, api, queries, small UI
  shared/     ui kit, http client, lib, config
```

A layer imports only from layers below it. Each slice exposes a public API through `index.ts`. Details and examples are in [AGENTS.md](AGENTS.md).

## Configuration

**Dev.** Copy `.env.example` to `.env.local`:

```bash
API_PROXY_TARGET=http://localhost:8080
APP_ENV=development
```

`API_PROXY_TARGET` is read by Vite only and never reaches the bundle. Without it the dev server starts with the proxy disabled.

**Runtime.** Every `APP_*` variable ends up in `window.__APP_CONFIG__` and is validated by zod in `src/shared/config/env.ts`. To add one, add a line to the schema there. In dev it comes from `.env.local`, in the container from `-e`.

## Docker

```bash
docker run -p 3000:80 \
  -e BACKEND_URL=http://backend:8080 \
  -e APP_ENV=production \
  your-account/my-app:1.0.0
```

| Variable      | Required | Purpose                              |
| ------------- | -------- | ------------------------------------ |
| `BACKEND_URL` | yes      | Where nginx proxies `/api` and `/ws` |
| `APP_*`       | no       | Runtime config for the app           |

The same image runs on staging and production. Only the variables change.

## Theme

Light, dark and system, with no flash on load. The default is `data-default-theme` on `<html>` in `index.html`. In code use `useTheme` from `@/shared/lib/theme`.

## AI agents

[AGENTS.md](AGENTS.md) is read by Codex, Cursor, Copilot and others. `CLAUDE.md` imports it for Claude Code. One source of rules for every tool and every person.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT-0](LICENSE) © [Alexander Mokeichuk](https://github.com/AlexanderMokeichuk)
