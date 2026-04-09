import test from "node:test";
import assert from "node:assert/strict";

import { parseGlobalOptions } from "../src/index.mjs";

test("parseGlobalOptions parses repo root and command args", () => {
  const parsed = parseGlobalOptions(["--repo-root", "C:/repo", "service", "start", "backend"]);
  assert.deepEqual(parsed.options, { repoRoot: "C:/repo" });
  assert.deepEqual(parsed.args, ["service", "start", "backend"]);
});

test("parseGlobalOptions strips leading double dash from pnpm passthrough", () => {
  const parsed = parseGlobalOptions(["--", "--project-prefix", "demo", "env"]);
  assert.deepEqual(parsed.options, { projectPrefix: "demo" });
  assert.deepEqual(parsed.args, ["env"]);
});
