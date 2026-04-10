import test from "node:test";
import assert from "node:assert/strict";

import { createRepoContext } from "../src/domains/runtime/context.mjs";
import { AIR_VERSION, resolveBackendCommand } from "../src/domains/runtime/backend-dev.mjs";
import { createFixtureRepo, removeFixtureRepo } from "./support/fixture-repo.mjs";

test("resolveBackendCommand prefers project air hot reload", () => {
  const repoRoot = createFixtureRepo("repo-cli-backend-air");

  try {
    const context = createRepoContext({ repoRoot });
    const command = resolveBackendCommand(context, {
      ensureAirBinary() {
        return {
          binaryPath: context.airBinary,
          version: AIR_VERSION,
          installedNow: false,
        };
      },
    });

    assert.equal(command.name, context.airBinary);
    assert.deepEqual(command.args, ["-c", context.airConfigFile, "--", "server", "-c", context.configFile]);
    assert.equal(command.mode, "hot-reload");
    assert.equal(command.runner, "air");
    assert.equal(command.toolScope, "project");
    assert.equal(command.toolVersion, AIR_VERSION);
  } finally {
    removeFixtureRepo(repoRoot);
  }
});

test("resolveBackendCommand falls back to go run when air bootstrap fails", () => {
  const repoRoot = createFixtureRepo("repo-cli-backend-go");

  try {
    const context = createRepoContext({ repoRoot });
    const command = resolveBackendCommand(context, {
      ensureAirBinary() {
        throw new Error("network unavailable");
      },
    });

    assert.equal(command.name, "go");
    assert.deepEqual(command.args, ["run", ".", "server", "-c", context.configFile]);
    assert.equal(command.mode, "detached");
    assert.equal(command.runner, "go");
    assert.match(command.note, /network unavailable/);
  } finally {
    removeFixtureRepo(repoRoot);
  }
});
