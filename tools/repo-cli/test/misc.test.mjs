import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { createRepoContext } from "../src/domains/runtime/context.mjs";
import { runReinit } from "../src/domains/misc/index.mjs";
import { setProjectPrefix } from "../src/domains/project-prefix/index.mjs";

test("setProjectPrefix writes and resets local profile", () => {
  const repoRoot = createFixtureRepo();
  try {
    const context = createRepoContext({ repoRoot });

    setProjectPrefix(context, "demo-brand", false);
    assert.equal(readFileSync(context.profilePath, "utf8"), '{\n  "project_prefix": "demo-brand"\n}\n');

    setProjectPrefix(context, "", true);
    assert.equal(existsSync(context.profilePath), false);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("runReinit clears runtime artifacts in isolated repo", async () => {
  const repoRoot = createFixtureRepo();

  try {
    const context = createRepoContext({ repoRoot });
    const targets = [
      path.join(repoRoot, ".tmp", "go", "cache"),
      path.join(repoRoot, ".tmp", "bin"),
      path.join(repoRoot, ".tmp", "docker"),
      context.runtimeDir,
      context.adminDistDir,
      context.mobileDistDir,
      context.showcaseDistDir,
      context.rootDistDir,
      context.backendBinary,
      context.installLockFile,
    ];

    for (const target of targets) {
      mkdirSync(path.dirname(target), { recursive: true });
      if (path.extname(target)) {
        writeFileSync(target, "fixture");
      } else {
        mkdirSync(target, { recursive: true });
        writeFileSync(path.join(target, ".marker"), "fixture");
      }
    }

    await runReinit(context, true);

    for (const target of targets) {
      assert.equal(existsSync(target), false, `expected ${target} to be removed`);
    }
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

function createFixtureRepo() {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "repo-cli-misc-"));
  mkdirSync(path.join(repoRoot, "config"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "apps", "admin-web"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "apps", "mobile-h5"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "apps", "ui-showcase"), { recursive: true });

  writeFileSync(path.join(repoRoot, "package.json"), JSON.stringify({ name: "fixture-repo", private: true }, null, 2));
  writeFileSync(path.join(repoRoot, "go.mod"), "module fixture-repo\n\ngo 1.24.0\n");
  writeFileSync(path.join(repoRoot, "config", "dev-ports.env"), "DEV_BACKEND_PORT=18123\nDEV_ADMIN_PORT=26173\nDEV_MOBILE_PORT=26174\nDEV_SHOWCASE_PORT=26175\nDEV_POSTGRES_PORT=15432\nDEV_REDIS_PORT=16379\n");
  return repoRoot;
}
