import test from "node:test";
import assert from "node:assert/strict";

import { createRepoContext, goEnv } from "../src/domains/runtime/context.mjs";
import { createFixtureRepo, removeFixtureRepo } from "./support/fixture-repo.mjs";

test("goEnv provides stable default GOPROXY for repo commands", () => {
  const repoRoot = createFixtureRepo("repo-cli-context");

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
    removeFixtureRepo(repoRoot);
  }
});

test("createRepoContext exposes project-scoped air paths", () => {
  const repoRoot = createFixtureRepo("repo-cli-air-context");

  try {
    const context = createRepoContext({ repoRoot });
    assert.equal(context.airConfigFile.endsWith(".air.toml"), true);
    assert.equal(context.airBinary.includes(".tmp"), true);
    assert.equal(context.airVersionFile.includes(".tmp"), true);
    assert.equal(context.backendDevBinary.includes(".tmp"), true);
  } finally {
    removeFixtureRepo(repoRoot);
  }
});
