import { goEnv } from "../runtime/context.mjs";
import { runCommandOrThrow } from "../../shared/process.mjs";
import { printDivider, printField, printSection } from "../../shared/output.mjs";

export function runDeps(context, target) {
  printSection(`安装依赖 (${target})`);
  switch (target) {
    case "backend":
      runCommandOrThrow("go", ["mod", "tidy"], { cwd: context.repoRoot, env: goEnv(context), stdio: "inherit" });
      printDivider();
      printField("结果", "后端依赖已同步");
      return;
    case "frontend":
      runCommandOrThrow("pnpm", ["install", "--store-dir", "./.pnpm-store"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      printDivider();
      printField("结果", "前端依赖已同步");
      return;
    case "all":
      runDeps(context, "backend");
      runDeps(context, "frontend");
      printDivider();
      printField("结果", "全部依赖已同步");
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
