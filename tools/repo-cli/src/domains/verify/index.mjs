import { runDeps } from "../deps/index.mjs";
import { runCommandOrThrow } from "../../shared/process.mjs";
import { goEnv } from "../runtime/context.mjs";

export function runTypecheck(context) {
  runCommandOrThrow("pnpm", ["typecheck"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
}

export function runFrontendScrollbarCheck(context) {
  runCommandOrThrow("pnpm", ["run", "check:local-scrollbars"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
}

export function runTest(context, target) {
  switch (target) {
    case "backend":
      runCommandOrThrow("go", ["test", "./..."], { cwd: context.repoRoot, env: goEnv(context), stdio: "inherit" });
      return;
    case "frontend":
      runCommandOrThrow("pnpm", ["test"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
      return;
    case "all":
      runTest(context, "backend");
      runTest(context, "frontend");
      return;
    default:
      throw new Error(`未知测试目标：${target}`);
  }
}

export function runVerify(context, target) {
  switch (target) {
    case "frontend":
      console.log("前端校验：安装依赖、检查局部滚动规则并执行类型检查");
      runDeps(context, "frontend");
      runFrontendScrollbarCheck(context);
      runTypecheck(context);
      return;
    case "backend":
      console.log("后端校验：执行 go test ./...");
      runTest(context, "backend");
      return;
    case "all":
      console.log("==> 前端校验");
      runVerify(context, "frontend");
      console.log("\n==> 后端校验");
      runVerify(context, "backend");
      return;
    default:
      throw new Error(`未知校验目标：${target}`);
  }
}
