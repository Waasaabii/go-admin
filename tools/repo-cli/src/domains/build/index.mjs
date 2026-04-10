import { goEnv } from "../runtime/context.mjs";
import { runCommandOrThrow } from "../../shared/process.mjs";
import { printDivider, printField, printSection } from "../../shared/output.mjs";

export function runBuild(context, target) {
  printSection(`构建目标 (${target})`);
  switch (target) {
    case "backend":
      runCommandOrThrow("go", ["build", "-ldflags=-w -s", "-o", context.backendBinary, "."], {
        cwd: context.repoRoot,
        env: goEnv(context, { CGO_ENABLED: "0" }),
        stdio: "inherit",
      });
      printDivider();
      printField("结果", "后端已构建");
      printField("产物", context.backendBinary);
      return;
    case "admin":
      runCommandOrThrow("pnpm", ["--filter", "@go-admin/admin-web", "build"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      printDivider();
      printField("结果", "管理端已构建");
      return;
    case "mobile":
      runCommandOrThrow("pnpm", ["--filter", "@go-admin/mobile-h5", "build"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      printDivider();
      printField("结果", "移动端已构建");
      return;
    case "showcase":
      runCommandOrThrow("pnpm", ["--filter", "@go-admin/ui-showcase", "build"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      printDivider();
      printField("结果", "Showcase 已构建");
      return;
    case "frontend":
      runCommandOrThrow("pnpm", ["build"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
      printDivider();
      printField("结果", "前端工作区已构建");
      return;
    case "docker":
      runDockerBuild(context);
      return;
    case "all":
      runBuild(context, "backend");
      runBuild(context, "frontend");
      printDivider();
      printField("结果", "全部构建完成");
      return;
    default:
      throw new Error(`未知构建目标：${target}`);
  }
}

export function runDockerBuild(context, dockerFile = "Dockerfile", push = false, tags) {
  const imageTags = (tags && tags.length > 0 ? tags : [`${context.packageName}:latest`]).filter(Boolean);
  const args = ["build", "-f", dockerFile];
  for (const tag of imageTags) {
    args.push("-t", tag);
  }
  args.push(".");
  runCommandOrThrow("docker", args, { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
  if (push) {
    for (const tag of imageTags) {
      runCommandOrThrow("docker", ["push", tag], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
    }
  }
}
