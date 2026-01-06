import child_process from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tsConfig = path.join(repoRoot, "tsconfig.base.json");
const seedScript = path.join(repoRoot, "prisma", "seed.ts");
const env = { ...process.env };
if (!env.TS_NODE_PROJECT) {
  env.TS_NODE_PROJECT = tsConfig;
}

const runner = child_process.spawn(
  process.execPath,
  [
    "--loader",
    "ts-node/esm",
    "--experimental-specifier-resolution=node",
    seedScript,
  ],
  {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  }
);

runner.on("error", (error) => {
  console.error("Failed to launch Prisma seed runner", error);
  process.exit(1);
});

runner.on("exit", (code) => {
  process.exit(code ?? 1);
});
