import { runDeps } from "../deps/index.mjs";
import { runCommandOrThrow } from "../../shared/process.mjs";
import { goEnv } from "../runtime/context.mjs";
import { printDivider, printField, printSection } from "../../shared/output.mjs";

export function runTypecheck(context) {
  printSection("执行类型检查");
  runCommandOrThrow("pnpm", ["typecheck"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
  printDivider();
  printField("结果", "类型检查通过");
}

export function runFrontendScrollbarCheck(context) {
  printSection("检查局部滚动规范");
  runCommandOrThrow("pnpm", ["run", "check:local-scrollbars"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
  printDivider();
  printField("结果", "局部滚动规范检查通过");
}

export function runTest(context, target) {
  printSection(`执行测试 (${target})`);
  switch (target) {
    case "backend":
      runCommandOrThrow("go", ["test", "./..."], { cwd: context.repoRoot, env: goEnv(context), stdio: "inherit" });
      printDivider();
      printField("结果", "后端测试通过");
      return;
    case "frontend":
      runCommandOrThrow("pnpm", ["test"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
      printDivider();
      printField("结果", "前端测试通过");
      return;
    case "all":
      runTest(context, "backend");
      runTest(context, "frontend");
      printDivider();
      printField("结果", "全部测试通过");
      return;
    default:
      throw new Error(`未知测试目标：${target}`);
  }
}

export function runVerify(context, target) {
  switch (target) {
    case "frontend":
      printSection("前端校验");
      runDeps(context, "frontend");
      runFrontendScrollbarCheck(context);
      runTypecheck(context);
      printDivider();
      printField("结果", "前端校验通过");
      return;
    case "backend":
      printSection("后端校验");
      runTest(context, "backend");
      printDivider();
      printField("结果", "后端校验通过");
      return;
    case "all":
      runVerify(context, "frontend");
      runVerify(context, "backend");
      printDivider();
      printField("结果", "全部校验通过");
      return;
    default:
      throw new Error(`未知校验目标：${target}`);
  }
}
