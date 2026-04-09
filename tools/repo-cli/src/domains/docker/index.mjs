import { composeBaseArgs, composeEnv } from "../runtime/context.mjs";
import { runCommandOrThrow } from "../../shared/process.mjs";
import { runDockerBuild } from "../build/index.mjs";

export function dockerUp(context) {
  runCommandOrThrow("docker", [...composeBaseArgs(context, false), "up", "-d"], {
    cwd: context.repoRoot,
    env: composeEnv(context),
    stdio: "inherit",
  });
}

export function dockerDown(context) {
  runCommandOrThrow("docker", [...composeBaseArgs(context, false), "down"], {
    cwd: context.repoRoot,
    env: composeEnv(context),
    stdio: "inherit",
  });
}

export function deploy(context) {
  runDockerBuild(context);
  dockerUp(context);
}
