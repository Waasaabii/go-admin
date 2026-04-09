import { goEnv } from "../runtime/context.mjs";
import { runCommandOrThrow } from "../../shared/process.mjs";

export function runBuild(context, target) {
  switch (target) {
    case "backend":
      runCommandOrThrow("go", ["build", "-ldflags=-w -s", "-o", context.backendBinary, "."], {
        cwd: context.repoRoot,
        env: goEnv(context, { CGO_ENABLED: "0" }),
        stdio: "inherit",
      });
      return;
    case "admin":
      runCommandOrThrow("pnpm", ["--filter", "@go-admin/admin-web", "build"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      return;
    case "mobile":
      runCommandOrThrow("pnpm", ["--filter", "@go-admin/mobile-h5", "build"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      return;
    case "showcase":
      runCommandOrThrow("pnpm", ["--filter", "@go-admin/ui-showcase", "build"], {
        cwd: context.repoRoot,
        env: process.env,
        stdio: "inherit",
      });
      return;
    case "frontend":
      runCommandOrThrow("pnpm", ["build"], { cwd: context.repoRoot, env: process.env, stdio: "inherit" });
      return;
    case "docker":
      runDockerBuild(context);
      return;
    case "all":
      runBuild(context, "backend");
      runBuild(context, "frontend");
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
