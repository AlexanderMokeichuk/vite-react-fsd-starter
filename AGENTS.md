# Agent Guide

React 19 + Vite starter built on Feature-Sliced Design. This file is the single source of rules for any AI agent and any human contributor.

## Stack

- React 19, TypeScript (strict), Vite 8, React Compiler, Bun.
- Tailwind CSS v4 + shadcn/ui (Radix).
- TanStack Query v5 for server state, Zustand for client state.
- react-router, react-hook-form + zod, TanStack Table v8, date-fns, lucide-react, sonner.
- No SSR, no Next.js. If a task implies otherwise, stop and say so.

Git hooks (lefthook) run eslint + prettier on commit, commitlint on the message and typecheck on push.

## Architecture

Layers, top to bottom. A layer may import only from layers below it. Enforced by `eslint-plugin-boundaries`.

```
src/
  app/        providers, router, layouts, global styles
  pages/      route screens, only compose widgets, no logic, ≤150 lines
  widgets/    large page blocks composed from features and entities
  features/   user actions: forms, mutations, buttons that change data
  entities/   business objects: types, api, queries, small display UI
  shared/     domain-free code: ui kit, http client, lib, config
```

- Slices in the same layer never import each other. Exception: `entities` may import other entities with `import type` only.
- Every slice exposes a public API through `index.ts`. Import `@/entities/order`, never `@/entities/order/ui/...`. Enforced by lint.
- Inside a slice use relative imports. Across slices use the `@/` alias.
- Slice segments, created only when needed:
  ```
  entities/order/
    api/     order.api.ts (fetch functions), order.queries.ts (query keys + hooks)
    model/   order.types.ts, order.schema.ts (zod), stores
    ui/      order-status-badge.tsx
    lib/     pure helpers
    index.ts
  ```
- Create a slice together with its first real file. Never create empty folders ahead of time. Remove a layer's `.gitkeep` once it has a real slice.

## State

| What                               | Where                                    |
| ---------------------------------- | ---------------------------------------- |
| Server data                        | TanStack Query in `entities/*/api`       |
| Table filters, pagination, sorting | URL search params                        |
| Session, current user, role        | Zustand in `entities/session`            |
| Form state                         | react-hook-form + zod inside the feature |
| Open/closed dialog                 | `useState` in the component              |

Zustand never holds a copy of server data.

## Code style

- **No comments in code.** No JSDoc, no explanatory comments. Names must carry the meaning.
- No `any`. Use `unknown` and narrow it.
- Explicit return types on exported functions only. No annotations on literals (`const x = 5`, not `const x: number = 5`).
- `import type { X }` on its own line, never inline `import { type X }`. Generated shadcn files in `src/shared/ui` keep their own style.
- File and folder names in kebab-case: `order-status-badge.tsx`.
- Named exports only, no default exports.
- React Compiler is on: no manual `useMemo`, `useCallback` or `React.memo`. Keep pure helpers outside components.
- Unused variables and params are errors. Prefix with `_` only when the name is required by a signature.
- No empty `catch` blocks.
- Validate every external input with zod: API responses, `localStorage`, runtime config.
- Runtime config only through `@/shared/config/env`. API calls go to the relative `/api` path, never a hardcoded host.
- Theme only through `useTheme` from `@/shared/lib/theme`. The default theme is `data-default-theme` on `<html>` in `index.html`. Never toggle the `dark` class directly.

## UI: surfaces

- Depth by tone: deeper is darker, raised is lighter.
- Light theme: page one step darker than cards (page `#fafafa`, card `#ffffff`). Dark theme: page darkest, cards lighter, popovers lighter still.
- Separate surfaces by tone first. A border only reinforces. Never white cards on a white page held apart by a hairline.
- Grays are strictly neutral. No beige, warm, olive or green cast in backgrounds, lines or secondary text.
- Use theme tokens (`bg-background`, `bg-card`, `text-muted-foreground`, …). Never hardcode hex in components.

## UI: color as signal

- Brand color: logo and the active navigation item.
- Primary: the one main action on a screen.
- Green for success, red for errors and destructive actions, yellow for warnings.
- Everything else neutral. The page must not turn into a rainbow.
- A selected state (tab, segment, row, card) is never gray alone: use a 2px primary bar, a light primary tint or strong text contrast. Gray selection is confused with disabled.
- Disabled is always weaker than any inactive element: lower contrast, default cursor, no hover (shadcn sets `pointer-events: none`).
- Color never carries meaning alone. Pair status with text or an icon.

## UI: motion

- All motion values live in `src/app/motion.css`. Never set `duration-*`, `ease-*` or `zoom-*` classes on shadcn components; change the variables there.
- Entrances: ease-out, `cubic-bezier(0.16, 1, 0.3, 1)`. Never ease-in for appearing. No springs that keep settling.
- Exits: shorter than the entrance, about 70% of its duration.
- Durations: button press 100–160ms, hover 100–150ms, menu/popover/tooltip 150–250ms, dialog 180–250ms. Nothing over 300ms.
- Nothing grows from a point: dialogs and popovers start at `scale(0.96)` with `opacity: 0` (`--motion-enter-scale`). Tested against fade-only, 96% feels smoother.
- Popovers open from their trigger: `transform-origin: var(--radix-popover-content-transform-origin)`.
- Buttons shrink on press: `active:scale-[0.97]`, about 120ms.
- Do not animate what users see a hundred times a day: row selection, tab switches, table pagination, frequent actions.
- Do not animate keyboard-initiated actions: hotkeys, arrow navigation.
- Tooltips: first one after ~500ms delay, subsequent ones instant while moving between triggers.
- Animate only `transform` and `opacity`. Never `width`, `height`, `top` or `margin`.
- Use CSS transitions, not keyframes, for toggled states, so they can be interrupted mid-way.
- Respect `prefers-reduced-motion`: keep fades, drop scale and movement.

## UI: loading and stability

- Nothing pops in from nowhere or jumps.
- Show a skeleton only after ~300ms of loading, so fast responses never flash one.
- Reserve space so loading never shifts the layout.
- Swap content (skeleton → data, A → B) with a fade, not a resize.
- On refetch keep the previous data visible: `placeholderData: keepPreviousData`.
- Content sized by measurement stays invisible until measured, then fades in at its final size.

## Workflow

1. If the task is ambiguous or needs an API contract that does not exist, stop and ask. Do not fake data on the client.
2. Implement in small steps.
3. New UI: show a preview first, implement fully after approval.
4. Commits follow Conventional Commits in English: `feat(orders): add status filter`. Never mention AI tools in commit messages.

## UI review checklist

1. Page is one tone darker than cards in both themes?
2. Grays neutral, no warm or green cast?
3. Color only where it signals something? One primary per screen?
4. Selected state distinct from disabled at a glance?
5. Every animation ease-out, ≤300ms, not from a point?
6. Frequent and keyboard actions not animated?
7. No layout jumps or skeleton flashes while loading?
8. `prefers-reduced-motion` respected?
