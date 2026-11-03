import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { styleText } from "node:util";
import * as p from "@clack/prompts";
import { z } from "zod";

const PLATFORM = "linux/amd64";
const PACKAGE_FILE = "package.json";
const DRY_RUN = process.argv.includes("--dry-run");
const TOTAL_STEPS = 4;
const IMAGE_NAME =
  /^([a-z0-9]+([._-][a-z0-9]+)*(:\d+)?\/)?[a-z0-9]+([._-][a-z0-9]+)*(\/[a-z0-9]+([._-][a-z0-9]+)*)*$/;
const CHECKS = [
  { label: "lint", script: "lint" },
  { label: "types", script: "typecheck" },
];

const packageSchema = z.looseObject({
  name: z.string(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  config: z.looseObject({ image: z.string().optional() }).optional(),
});

type PackageJson = z.infer<typeof packageSchema>;
type Bump = "patch" | "minor" | "major";

interface RunResult {
  code: number;
  output: string;
}

function run(command: string, args: string[], onLine?: (line: string) => void): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const collect = (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      if (onLine) {
        text
          .split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .forEach(onLine);
      }
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    child.on("error", (error) => resolve({ code: 1, output: error.message }));
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

function runInTerminal(command: string, args: string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", () => resolve(1));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function git(...args: string[]): Promise<string> {
  const result = await run("git", args);
  return result.code === 0 ? result.output.trim() : "";
}

function bumpVersion(version: string, bump: Bump): string {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function lastLines(text: string, count: number): string {
  return text.trim().split(/\r?\n/).slice(-count).join("\n");
}

let wizardScreen = false;

function enterWizardScreen(): void {
  if (process.stdout.isTTY) {
    process.stdout.write("\x1b[?1049h");
    wizardScreen = true;
  }
}

function leaveWizardScreen(): void {
  if (wizardScreen) {
    process.stdout.write("\x1b[?1049l");
    wizardScreen = false;
  }
}

process.on("exit", leaveWizardScreen);

function stop(message: string): never {
  leaveWizardScreen();
  p.cancel(message);
  process.exit(0);
}

function fail(message: string): never {
  leaveWizardScreen();
  p.cancel(message);
  process.exit(1);
}

function exitIfCancelled<T>(value: T): Exclude<T, symbol> {
  if (typeof value === "symbol") {
    stop("Cancelled. Nothing was built or pushed.");
  }
  return value as Exclude<T, symbol>;
}

async function readPackage(): Promise<{ data: PackageJson; raw: string }> {
  const raw = await readFile(PACKAGE_FILE, "utf8").catch(() =>
    fail(`No ${PACKAGE_FILE} here. Run it from the project root.`),
  );
  const parsed = packageSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    fail(`${PACKAGE_FILE} needs "name" and a semver "version" like 1.2.3.`);
  }
  return { data: parsed.data, raw };
}

async function writePackage(data: PackageJson): Promise<void> {
  await writeFile(PACKAGE_FILE, `${JSON.stringify(data, null, 2)}\n`);
}

const completed: string[] = [];

function complete(label: string, value: string): void {
  completed.push(`${styleText("dim", label.padEnd(8))} ${value}`);
}

function printHeader(): void {
  process.stdout.write("\n");
  p.intro(
    styleText(["bgCyan", "black"], " docker image ") +
      (DRY_RUN ? styleText("yellow", "  dry run") : ""),
  );
  for (const line of completed) {
    p.log.message(line, { symbol: styleText("green", "✔"), spacing: 0 });
  }
}

function screen(step: number, title: string): void {
  if (wizardScreen) {
    process.stdout.write("\x1b[H\x1b[2J");
  }
  printHeader();
  p.log.step(styleText("bold", `Step ${step}/${TOTAL_STEPS} · ${title}`));
}

async function runChecks(): Promise<void> {
  printHeader();
  const spin = p.spinner();
  spin.start("Checking");
  for (const check of CHECKS) {
    spin.message(`Checking ${check.label}`);
    const result = await run("bun", ["run", check.script]);
    if (result.code !== 0) {
      spin.error(`${check.label} failed`);
      leaveWizardScreen();
      printHeader();
      p.log.error(`${check.label} failed`);
      p.log.message(lastLines(result.output, 15), { spacing: 0 });
      fail(`Fix ${check.label} and run again. Nothing was built.`);
    }
  }
  spin.stop("lint and types are clean");
  complete("Checks", CHECKS.map((check) => check.label).join(" · "));
}

function defaultImageName(): string {
  return basename(process.cwd())
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}

async function resolveImage(pkg: PackageJson): Promise<string> {
  const saved = pkg.config?.image;
  if (saved) {
    p.log.message(`${styleText("dim", "Image  ")}  ${styleText("cyan", saved)}`, { spacing: 0 });
    return saved;
  }
  const image = exitIfCancelled(
    await p.text({
      message: "Docker image name (saved for next time)",
      initialValue: defaultImageName(),
      validate: (value) =>
        value && IMAGE_NAME.test(value) ? undefined : "Lowercase letters, digits, . _ - and / only",
    }),
  );
  if (!image.includes("/")) {
    p.log.warn("No namespace. Docker Hub needs account/name to accept the push.");
  }
  pkg.config = { ...pkg.config, image };
  if (!DRY_RUN) {
    await writePackage(pkg);
  }
  return image;
}

async function stepProject(pkg: PackageJson, branch: string, dirty: string): Promise<string> {
  screen(1, "Project");
  p.log.message(
    [
      `${styleText("dim", "Folder ")}  ${basename(process.cwd())}`,
      `${styleText("dim", "Project")}  ${pkg.name}`,
      `${styleText("dim", "Branch ")}  ${branch}`,
      `${styleText("dim", "Version")}  ${pkg.version}`,
    ],
    { spacing: 0 },
  );
  const image = await resolveImage(pkg);
  if (dirty) {
    p.log.warn("Uncommitted changes will go into the image but not into the release commit.");
  }
  const confirmed = exitIfCancelled(
    await p.confirm({ message: "Is this the right project?", initialValue: true }),
  );
  if (!confirmed) {
    stop("Go to the right folder and run again.");
  }
  complete("Project", `${pkg.name} · ${branch} · v${pkg.version}`);
  complete("Image", styleText("cyan", image));
  return image;
}

async function stepVersion(current: string): Promise<string> {
  screen(2, "Version");
  const arrow = (bump: Bump) => `${current} → ${styleText("green", bumpVersion(current, bump))}`;
  const bump = exitIfCancelled(
    await p.select<Bump>({
      message: "Which version?",
      initialValue: "patch",
      options: [
        { value: "patch", label: `patch   ${arrow("patch")}`, hint: "bug fixes" },
        { value: "minor", label: `minor   ${arrow("minor")}`, hint: "new features" },
        { value: "major", label: `major   ${arrow("major")}`, hint: "breaking changes" },
      ],
    }),
  );
  const version = bumpVersion(current, bump);
  complete("Version", `${current} → ${version} (${bump})`);
  return version;
}

async function stepTags(image: string, version: string): Promise<string[]> {
  screen(3, "Tags");
  const latest = exitIfCancelled(
    await p.confirm({ message: `Also tag as ${image}:latest?`, initialValue: true }),
  );
  const tags = [`${image}:${version}`, ...(latest ? [`${image}:latest`] : [])];
  complete("Tags", tags.map((tag) => tag.slice(image.length + 1)).join(", "));
  return tags;
}

async function main(): Promise<void> {
  const { data: pkg, raw: originalPackage } = await readPackage();
  const [branch, dirty] = await Promise.all([
    git("rev-parse", "--abbrev-ref", "HEAD"),
    git("status", "--porcelain"),
  ]);
  if (!branch) {
    fail("Not a git repository.");
  }

  enterWizardScreen();
  await runChecks();

  const image = await stepProject(pkg, branch, dirty);
  const version = await stepVersion(pkg.version);
  const tags = await stepTags(image, version);

  screen(4, "Ship");
  const dockerArgs = [
    "buildx",
    "build",
    "--platform",
    PLATFORM,
    ...tags.flatMap((tag) => ["--tag", tag]),
    "--push",
    ".",
  ];
  p.log.message(
    [
      `${styleText("dim", "docker")}  build ${PLATFORM} and push`,
      `${styleText("dim", "git   ")}  commit + tag v${version} + push`,
    ],
    { spacing: 0 },
  );
  const go = exitIfCancelled(await p.confirm({ message: "Build and push?", initialValue: true }));
  if (!go) {
    stop("Nothing was built or pushed.");
  }

  leaveWizardScreen();
  complete("Ship", `${PLATFORM} → ${tags.join(", ")}`);
  printHeader();

  if (DRY_RUN) {
    p.log.message(`docker ${dockerArgs.join(" ")}`, { spacing: 0 });
    p.log.message(
      `git commit -m "chore(release): v${version}" && git tag -a v${version} && git push --follow-tags`,
      { spacing: 0 },
    );
    p.outro("Dry run finished. Nothing was changed.");
    return;
  }

  const releasePackage = { ...pkg, version };
  await writePackage(releasePackage);

  const log = p.taskLog({ title: `Building ${tags[0]}`, limit: 8 });
  const build = await run("docker", dockerArgs, (line) => log.message(line));
  if (build.code !== 0) {
    await writeFile(PACKAGE_FILE, originalPackage);
    log.error("Docker build failed. Version was not changed.");
    process.exit(1);
  }
  log.success(`Pushed ${tags.join(", ")}`);

  const spin = p.spinner();
  spin.start(`Committing v${version}`);
  const steps: string[][] = [
    ["add", PACKAGE_FILE],
    ["commit", "--no-verify", "-m", `chore(release): v${version}`, "--", PACKAGE_FILE],
    ["tag", "-a", `v${version}`, "-m", `v${version}`],
  ];
  for (const step of steps) {
    const result = await run("git", step);
    if (result.code !== 0) {
      spin.error(`git ${step[0]} failed`);
      p.log.error(lastLines(result.output, 10));
      fail(`Image is pushed, but git ${step[0]} failed. Finish it by hand.`);
    }
  }
  spin.stop(`Committed and tagged v${version}`);

  p.log.step("git push --follow-tags");
  if ((await runInTerminal("git", ["push", "--no-verify", "--follow-tags"])) !== 0) {
    fail(
      `Image is pushed and v${version} is committed locally. Run git push --follow-tags by hand.`,
    );
  }
  p.log.success(`Pushed v${version} to origin`);

  p.outro(`Done  ${styleText("cyan", tags[0] ?? "")}`);
}

await main();
