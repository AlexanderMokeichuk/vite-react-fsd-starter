import { spawnSync } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const STARTER_NAME = "vite-react-fsd-starter";
const STARTER_URL = `https://github.com/AlexanderMokeichuk/${STARTER_NAME}`;
const FORCE = process.argv.includes("--force");

const STARTER_ONLY = [
  ".github/ISSUE_TEMPLATE",
  ".github/pull_request_template.md",
  ".github/FUNDING.yml",
  "CONTRIBUTING.md",
  "LICENSE",
  "tools/init-project.ts",
];

const STARTER_FIELDS = [
  "description",
  "keywords",
  "license",
  "repository",
  "homepage",
  "bugs",
  "author",
  "config",
];

function projectReadme(name: string): string {
  return `# ${name}

Built with [vite-react-fsd-starter](${STARTER_URL}).

## Getting started

\`\`\`bash
cp .env.example .env.local
bun run dev
\`\`\`

## Scripts

| Command | What it does |
| --- | --- |
| \`bun run dev\` | Dev server with \`/api\` and \`/ws\` proxy |
| \`bun run build\` | Type check and production build |
| \`bun run lint\` | ESLint, including layer boundaries |
| \`bun run format\` | Prettier |
| \`bun run test\` | Vitest |
| \`bun run image\` | Release a Docker image |

Code rules for people and AI agents: [AGENTS.md](AGENTS.md).
`;
}

function exec(command: string, ...args: string[]): boolean {
  return spawnSync(command, args, { stdio: "ignore" }).status === 0;
}

async function cleanPackage(pkg: Record<string, unknown>): Promise<string> {
  for (const field of STARTER_FIELDS) {
    delete pkg[field];
  }
  const scripts = pkg.scripts;
  if (scripts && typeof scripts === "object") {
    delete (scripts as Record<string, unknown>).postinstall;
  }
  pkg.version = "0.0.0";
  await writeFile("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
  return typeof pkg.name === "string" ? pkg.name : basename(process.cwd());
}

async function main(): Promise<void> {
  const pkg: Record<string, unknown> = JSON.parse(await readFile("package.json", "utf8"));
  if (pkg.name === STARTER_NAME && !FORCE) {
    return;
  }
  await Promise.all(STARTER_ONLY.map((path) => rm(path, { recursive: true, force: true })));
  const name = await cleanPackage(pkg);
  await writeFile("README.md", projectReadme(name));
  exec("bun", "x", "prettier", "--write", "README.md", "package.json");

  const isFreshRepo =
    exec("git", "rev-parse", "HEAD") &&
    !exec("git", "rev-parse", "HEAD~1") &&
    !exec("git", "config", "--get", "remote.origin.url");
  if (isFreshRepo) {
    exec("git", "add", "-A");
    exec("git", "commit", "--amend", "--no-edit", "--no-verify", "-q");
  }
}

await main();
