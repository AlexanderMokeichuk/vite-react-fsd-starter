# Contributing

Thanks for helping. Bug fixes, docs and small improvements are always welcome. For bigger changes open an issue first so we can agree on the approach.

## Setup

```bash
git clone https://github.com/AlexanderMokeichuk/vite-react-fsd-starter.git
cd vite-react-fsd-starter
bun install
cp .env.example .env.local
bun run dev
```

`bun install` also sets up git hooks: lint and format run on commit, commit messages are checked, types are checked on push.

## Rules

All code rules live in [AGENTS.md](AGENTS.md): architecture layers, code style, UI and motion. The same file guides AI agents, so humans and tools follow one source.

The short version:

- Respect the layers: `app → pages → widgets → features → entities → shared`. ESLint will stop you if you don't.
- Import slices through their `index.ts`.
- No `any`, no comments in code, kebab-case file names.
- UI uses theme tokens, never hardcoded colors, and works in both themes.

## Commits and pull requests

- Branch from `main`, one topic per PR.
- [Conventional Commits](https://www.conventionalcommits.org): `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`.
- CI must be green: lint, types, tests, build and Docker image.
