import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createRepoContext } from "../src/domains/runtime/context.mjs";
import { runReinit } from "../src/domains/misc/index.mjs";
import { setProjectPrefix } from "../src/domains/project-prefix/index.mjs";
import { createFixtureRepo, removeFixtureRepo } from "./support/fixture-repo.mjs";

test("setProjectPrefix writes and resets local profile", () => {
  const repoRoot = createFixtureRepo("repo-cli-prefix");
  try {
    const context = createRepoContext({ repoRoot });

    setProjectPrefix(context, "demo-brand", false);
    assert.equal(readFileSync(context.profilePath, "utf8"), '{\n  "project_prefix": "demo-brand"\n}\n');

    setProjectPrefix(context, "", true);
    assert.equal(existsSync(context.profilePath), false);
  } finally {
    removeFixtureRepo(repoRoot);
  }
});

test("runReinit clears runtime artifacts in isolated repo", async () => {
  const repoRoot = createFixtureRepo("repo-cli-reinit");

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
    removeFixtureRepo(repoRoot);
  }
});
