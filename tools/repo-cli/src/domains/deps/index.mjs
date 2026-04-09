import { goEnv } from "../runtime/context.mjs";
import { runCommandOrThrow } from "../../shared/process.mjs";

export function runDeps(context, target) {
  switch (target) {
    case "backend":
      runCommandOrThrow("go", ["mod", "tidy"], { cwd: context.repoRoot, env: goEnv(context), stdio: "inherit" });
      return;
    case "frontend":
      runCommandOrThrow("pnpm", ["install", "--store-dir", "./.pnpm-store"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      return;
    case "all":
      runDeps(context, "backend");
      runDeps(context, "frontend");
      return;
    default:
      throw new Error(`未知依赖目标：${target}`);
  }
}

export function syncFrontendLockfile(context) {
  runCommandOrThrow("pnpm", ["install", "--lockfile-only", "--ignore-scripts", "--store-dir", "./.pnpm-store"], {
    cwd: context.repoRoot,
    env: process.env,
    stdio: "inherit",
  });
}
