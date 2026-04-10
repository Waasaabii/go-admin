import path from "node:path";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const fixtureRoot = path.join(process.cwd(), ".tmp", "repo-cli-tests");

export function createFixtureRepo(prefix = "repo-cli-fixture") {
  const repoRoot = path.join(fixtureRoot, `${prefix}-${randomUUID().slice(0, 8)}`);

  mkdirSync(path.join(repoRoot, "config"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "apps", "admin-web"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "apps", "mobile-h5"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "apps", "ui-showcase"), { recursive: true });

  writeFileSync(path.join(repoRoot, "package.json"), JSON.stringify({ name: "fixture-repo", private: true }, null, 2));
  writeFileSync(path.join(repoRoot, "go.mod"), "module fixture-repo\n\ngo 1.24.0\n");
  writeFileSync(
    path.join(repoRoot, "config", "dev-ports.env"),
    "DEV_BACKEND_PORT=18123\nDEV_ADMIN_PORT=26173\nDEV_MOBILE_PORT=26174\nDEV_SHOWCASE_PORT=26175\nDEV_POSTGRES_PORT=15432\nDEV_REDIS_PORT=16379\n",
  );

  return repoRoot;
}

export function removeFixtureRepo(repoRoot) {
  rmSync(repoRoot, { recursive: true, force: true });
}
