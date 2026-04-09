import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { createRepoContext } from "../src/domains/runtime/context.mjs";
import { applyRules, runRename } from "../src/domains/rename/index.mjs";

const legacyBrand = ["sui", "yuan"].join("");
const legacyBrandAdmin = `${legacyBrand}-admin`;
const legacyBrandTitle = "Sui" + "yuan";
const legacyBrandAdminTitle = `${legacyBrandTitle} Admin`;
const legacyBrandUiUpper = `${legacyBrand.toUpperCase()} UI`;

test("applyRules rewrites workspace scope and go module imports", () => {
  const packageJson = JSON.stringify({ name: "@old-scope/demo", dependencies: { "@old-scope/core": "workspace:*" } }, null, 2);
  const updatedPackageJson = applyRules("package.json", packageJson, "old-root", "old-scope", "new-brand");
  assert.match(updatedPackageJson, /"@new-brand\/demo"/);
  assert.match(updatedPackageJson, /"@new-brand\/core"/);

  const goSource = 'module old-root\n\nimport "old-root/common"\n';
  const updatedGoSource = applyRules("go.mod", goSource, "old-root", "old-scope", "new-brand");
  assert.match(updatedGoSource, /module new-brand/);
  assert.match(updatedGoSource, /"new-brand\/common"/);
});

test("applyRules rewrites legacy brand aliases even when target brand matches current root", () => {
  const source = [
    `const locale = "${legacyBrand}:admin:locale";`,
    `const theme = "${legacyBrandAdmin}-theme";`,
    `const session = "@${legacyBrand}/auth";`,
    `const title = "${legacyBrandAdminTitle}";`,
    `const watermark = "${legacyBrandUiUpper}";`,
    `const plugin = "${legacyBrand}-auto-data-attrs";`,
  ].join("\n");

  const updated = applyRules("main.tsx", source, "go-admin", "go-admin", "go-admin");

  assert.match(updated, /go-admin:admin:locale/);
  assert.match(updated, /go-admin-theme/);
  assert.match(updated, /@go-admin\/auth/);
  assert.match(updated, /Go Admin/);
  assert.match(updated, /GO ADMIN UI/);
  assert.match(updated, /go-admin-auto-data-attrs/);
});

test("runRename rolls back modified files when lockfile sync fails", async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "repo-cli-rename-"));
  const originalPath = process.env.PATH;

  try {
    seedRepo(repoRoot);
    installFailingPnpm(repoRoot);
    process.env.PATH = joinPath(repoRoot, originalPath);

    const context = createRepoContext({ repoRoot });
    await assert.rejects(
      runRename(context, "new-brand", { dryRun: false, yes: true, verify: false }),
      /rename 失败，已回滚/,
    );

    assert.equal(JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).name, "old-root");
    assert.equal(readFileSync(path.join(repoRoot, "README.md"), "utf8"), "old-root docs\n");
    assert.equal(JSON.parse(readFileSync(path.join(repoRoot, "frontend", "packages", "demo", "package.json"), "utf8")).name, "@oldscope/demo");
    assert.equal(readFileSync(context.profilePath, "utf8"), '{\n  "project_prefix": "old-root"\n}\n');
  } finally {
    process.env.PATH = originalPath;
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("runRename updates files, lockfile and profile on success", async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "repo-cli-rename-ok-"));
  const originalPath = process.env.PATH;

  try {
    seedRepo(repoRoot);
    installSuccessfulPnpm(repoRoot);
    process.env.PATH = joinPath(repoRoot, originalPath);

    const context = createRepoContext({ repoRoot });
    await runRename(context, "new-brand", { dryRun: false, yes: true, verify: false });

    assert.equal(JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).name, "new-brand");
    assert.equal(readFileSync(path.join(repoRoot, "README.md"), "utf8"), "new-brand docs\n");
    assert.equal(JSON.parse(readFileSync(path.join(repoRoot, "frontend", "packages", "demo", "package.json"), "utf8")).name, "@new-brand/demo");
    assert.equal(readFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "utf8").trim(), "lockfile synced");
    assert.equal(readFileSync(context.profilePath, "utf8"), '{\n  "project_prefix": "new-brand"\n}\n');
  } finally {
    process.env.PATH = originalPath;
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("runRename covers legacy brand residues when renaming to the current go-admin brand", async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "repo-cli-rename-legacy-"));
  const originalPath = process.env.PATH;

  try {
    seedGoAdminLegacyRepo(repoRoot);
    installSuccessfulPnpm(repoRoot);
    process.env.PATH = joinPath(repoRoot, originalPath);

    const context = createRepoContext({ repoRoot });
    await runRename(context, "go-admin", { dryRun: false, yes: true, verify: false });

    const mainSource = readFileSync(path.join(repoRoot, "frontend", "apps", "admin-web", "src", "main.tsx"), "utf8");
    const uiSource = readFileSync(path.join(repoRoot, "frontend", "packages", "ui-admin", "src", "layout.tsx"), "utf8");

    assert.match(mainSource, /go-admin:admin:locale/);
    assert.doesNotMatch(mainSource, new RegExp(legacyBrand, "i"));
    assert.match(uiSource, /go-admin-sidebar-collapsed/);
    assert.match(uiSource, /Go Admin/);
    assert.doesNotMatch(uiSource, new RegExp(legacyBrand, "i"));
    assert.equal(readFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "utf8").trim(), "lockfile synced");
  } finally {
    process.env.PATH = originalPath;
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

function seedRepo(repoRoot) {
  mkdirSync(path.join(repoRoot, "config"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "packages", "demo"), { recursive: true });

  writeFileSync(path.join(repoRoot, "package.json"), JSON.stringify({ name: "old-root", private: true }, null, 2));
  writeFileSync(path.join(repoRoot, "go.mod"), "module old-root\n\ngo 1.24.0\n");
  writeFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  writeFileSync(path.join(repoRoot, "README.md"), "old-root docs\n");
  writeFileSync(path.join(repoRoot, "config", "dev-ports.env"), "DEV_BACKEND_PORT=18123\n");
  writeFileSync(path.join(repoRoot, "frontend", "packages", "demo", "package.json"), JSON.stringify({ name: "@oldscope/demo" }, null, 2));

  const context = createRepoContext({ repoRoot });
  writeFileSync(context.profilePath, '{\n  "project_prefix": "old-root"\n}\n');
}

function seedGoAdminLegacyRepo(repoRoot) {
  mkdirSync(path.join(repoRoot, "config"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "apps", "admin-web", "src"), { recursive: true });
  mkdirSync(path.join(repoRoot, "frontend", "packages", "ui-admin", "src"), { recursive: true });

  writeFileSync(path.join(repoRoot, "package.json"), JSON.stringify({ name: "go-admin", private: true }, null, 2));
  writeFileSync(path.join(repoRoot, "go.mod"), "module go-admin\n\ngo 1.24.0\n");
  writeFileSync(path.join(repoRoot, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  writeFileSync(path.join(repoRoot, "config", "dev-ports.env"), "DEV_BACKEND_PORT=18123\n");
  writeFileSync(
    path.join(repoRoot, "frontend", "apps", "admin-web", "src", "main.tsx"),
    `const localeKey = "${legacyBrand}:admin:locale";\nconst packageName = "@${legacyBrand}/admin-web";\n`,
  );
  writeFileSync(
    path.join(repoRoot, "frontend", "packages", "ui-admin", "src", "layout.tsx"),
    `const sidebarKey = "${legacyBrandAdmin}-sidebar-collapsed";\nconst brand = "${legacyBrandAdminTitle}";\nconst watermark = "${legacyBrandUiUpper}";\n`,
  );

  const context = createRepoContext({ repoRoot });
  writeFileSync(context.profilePath, '{\n  "project_prefix": "go-admin"\n}\n');
}

function installFailingPnpm(repoRoot) {
  const binDir = path.join(repoRoot, ".fake-bin");
  mkdirSync(binDir, { recursive: true });

  if (process.platform === "win32") {
    writeFileSync(path.join(binDir, "pnpm.cmd"), "@echo off\r\necho fake pnpm failure 1>&2\r\nexit /b 1\r\n");
    return;
  }

  const scriptPath = path.join(binDir, "pnpm");
  writeFileSync(scriptPath, "#!/bin/sh\nprintf 'fake pnpm failure\\n' >&2\nexit 1\n");
  chmodSync(scriptPath, 0o755);
}

function installSuccessfulPnpm(repoRoot) {
  const binDir = path.join(repoRoot, ".fake-bin");
  mkdirSync(binDir, { recursive: true });

  if (process.platform === "win32") {
    writeFileSync(path.join(binDir, "pnpm.cmd"), "@echo off\r\necho lockfile synced> pnpm-lock.yaml\r\nexit /b 0\r\n");
    return;
  }

  const scriptPath = path.join(binDir, "pnpm");
  writeFileSync(scriptPath, "#!/bin/sh\nprintf 'lockfile synced\\n' > pnpm-lock.yaml\nexit 0\n");
  chmodSync(scriptPath, 0o755);
}

function joinPath(prefix, originalPath) {
  return [path.join(prefix, ".fake-bin"), originalPath].filter(Boolean).join(path.delimiter);
}
