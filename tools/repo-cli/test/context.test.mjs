import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { createRepoContext, goEnv } from "../src/domains/runtime/context.mjs";

test("goEnv provides stable default GOPROXY for repo commands", () => {
  const repoRoot = createFixtureRepo();

  try {
    const previous = process.env.GOPROXY;
    delete process.env.GOPROXY;

    const context = createRepoContext({ repoRoot });
    const env = goEnv(context);
    assert.equal(env.GOPROXY, "https://goproxy.cn,direct");

    process.env.GOPROXY = "https://example.invalid,direct";
    const overridden = goEnv(context);
    assert.equal(overridden.GOPROXY, "https://example.invalid,direct");

    if (previous) {
      process.env.GOPROXY = previous;
    } else {
      delete process.env.GOPROXY;
    }
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

function createFixtureRepo() {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "repo-cli-context-"));
  mkdirSync(path.join(repoRoot, "config"), { recursive: true });

  writeFileSync(path.join(repoRoot, "package.json"), JSON.stringify({ name: "fixture-repo", private: true }, null, 2));
  writeFileSync(path.join(repoRoot, "go.mod"), "module fixture-repo\n\ngo 1.24.0\n");
  writeFileSync(path.join(repoRoot, "config", "dev-ports.env"), "DEV_BACKEND_PORT=18123\n");

  return repoRoot;
}
