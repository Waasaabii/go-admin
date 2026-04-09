import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

import { normalizeProjectPrefix } from "../runtime/context.mjs";
import { saveProfile } from "../runtime/state.mjs";
import { syncFrontendLockfile } from "../deps/index.mjs";
import { runVerify } from "../verify/index.mjs";

const LEGACY_BRAND_BASE = ["sui", "yuan"].join("");
const LEGACY_BRAND_ALIASES = [`${LEGACY_BRAND_BASE}-admin`, LEGACY_BRAND_BASE];

export async function runRename(context, brand, options) {
  const newRoot = normalizeProjectPrefix(brand.trim());
  if (!newRoot) {
    throw new Error("brand 规范化后为空，请换一个名字");
  }

  const plan = previewRename(context, context.packageName, detectWorkspaceScope(context.repoRoot), newRoot);
  if (plan.files.length === 0) {
    console.log("未发现需要重命名的文件");
    return;
  }

  process.stdout.write(`品牌重命名计划：root "${plan.oldRoot}" -> "${plan.newRoot}"`);
  if (plan.oldScope) {
    process.stdout.write(`，scope @${plan.oldScope} -> @${plan.newRoot}`);
  }
  process.stdout.write("\n");
  console.log(`将修改 ${plan.files.length} 个文件`);
  for (const file of plan.files) {
    console.log(`  - ${file}`);
  }

  if (options.dryRun) {
    return;
  }

  if (!options.yes) {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new Error("非交互终端执行 rename 必须显式传入 --yes");
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question("⚠️ 将直接修改仓库内品牌相关文件，确认继续？[y/N]: ")).trim().toLowerCase();
    rl.close();
    if (answer !== "y" && answer !== "yes") {
      throw new Error("已取消 rename");
    }
  }

  const snapshot = captureRenameSnapshot(context, plan.files);
  const previousProfile = readOptionalFile(context.profilePath);

  try {
    applyRename(context, plan);
    saveProfile(context, newRoot);
    syncRenameArtifacts(context);
  } catch (error) {
    restoreRenameSnapshot(context, snapshot);
    restoreProfile(context.profilePath, previousProfile);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`rename 失败，已回滚：${message}`);
  }

  console.log("\n==> 完成");
  console.log(`已完成品牌重命名并更新 ${plan.files.length} 个文件`);
  if (!options.verify) {
    console.log("未自动执行校验；如需检查依赖、类型与后端测试，请执行：pnpm repo:verify:all");
    return;
  }

  console.log("\n==> 校验");
  runVerify(context, "all");
  console.log("\nrename 完成");
}

function detectWorkspaceScope(repoRoot) {
  const counts = new Map();
  walk(path.join(repoRoot, "frontend"), (currentPath, isDirectory) => {
    if (isDirectory) {
      const name = path.basename(currentPath);
      if (name === "node_modules" || name === "dist") {
        return "skip";
      }
      return "continue";
    }
    if (path.basename(currentPath) !== "package.json") {
      return "continue";
    }
    const payload = JSON.parse(readFileSync(currentPath, "utf8"));
    if (!payload.name?.startsWith("@")) {
      return "continue";
    }
    const [scope] = payload.name.slice(1).split("/", 2);
    if (scope) {
      counts.set(scope, (counts.get(scope) ?? 0) + 1);
    }
    return "continue";
  });

  let best = "";
  let bestCount = 0;
  for (const [scope, count] of counts.entries()) {
    if (count > bestCount) {
      best = scope;
      bestCount = count;
    }
  }
  return best;
}

export function previewRename(context, oldRoot, oldScope, newRoot) {
  const files = [];
  walk(context.repoRoot, (currentPath, isDirectory) => {
    if (isDirectory) {
      return shouldSkipDir(path.basename(currentPath)) ? "skip" : "continue";
    }
    if (!shouldProcessFile(currentPath)) {
      return "continue";
    }
    const original = readFileSync(currentPath, "utf8");
    const updated = applyRules(currentPath, original, oldRoot, oldScope, newRoot);
    if (updated !== original) {
      files.push(path.relative(context.repoRoot, currentPath));
    }
    return "continue";
  });

  files.sort();
  return { oldRoot, oldScope, newRoot, files };
}

function applyRename(context, plan) {
  for (const rel of plan.files) {
    const filePath = path.join(context.repoRoot, rel);
    const original = readFileSync(filePath, "utf8");
    const updated = applyRules(filePath, original, plan.oldRoot, plan.oldScope, plan.newRoot);
    writeFileSync(filePath, updated, "utf8");
    console.log(`已更新 ${rel}`);
  }
}

export function applyRules(filePath, content, oldRoot, oldScope, newRoot) {
  let updated = content;
  if (oldScope && oldScope !== newRoot) {
    updated = updated.replaceAll(`@${oldScope}/`, `@${newRoot}/`);
  }
  for (const alias of LEGACY_BRAND_ALIASES) {
    updated = replaceBrandVariants(updated, alias, newRoot);
  }
  if (!oldRoot || oldRoot === newRoot) {
    return updated;
  }

  updated = replaceBrandVariants(updated, oldRoot, newRoot);

  const ext = path.extname(filePath).toLowerCase();
  const escapedRoot = escapeRegExp(oldRoot);
  const exactToken = new RegExp(`(^|[^A-Za-z0-9_-])(${escapedRoot})([^A-Za-z0-9_-]|$)`, "gm");
  const moduleLine = new RegExp(`^module\\s+${escapedRoot}$`, "gm");
  const goImport = new RegExp(`"${escapedRoot}/`, "g");
  const slashDirective = new RegExp(`${escapedRoot}/`, "g");

  switch (ext) {
    case ".go":
      updated = updated.replace(moduleLine, `module ${newRoot}`);
      updated = updated.replace(goImport, `"${newRoot}/`);
      updated = updated.replace(exactToken, `$1${newRoot}$3`);
      break;
    case ".mod":
      updated = updated.replace(moduleLine, `module ${newRoot}`);
      updated = updated.replace(exactToken, `$1${newRoot}$3`);
      break;
    default:
      updated = updated.replace(exactToken, `$1${newRoot}$3`);
      if ([".md", ".txt", ".yml", ".yaml", ".json", ".toml"].includes(ext)) {
        updated = updated.replace(slashDirective, `${newRoot}/`);
      }
      break;
  }

  return updated;
}

function shouldSkipDir(name) {
  return [".git", ".tmp", "temp", "node_modules", ".pnpm-store", "vendor", "dist", ".next", ".turbo", ".idea", ".vscode"].includes(name);
}

function shouldProcessFile(filePath) {
  const base = path.basename(filePath);
  if (base === "go.sum" || base === "pnpm-lock.yaml" || base.endsWith(".lock")) {
    return false;
  }
  return [
    ".go",
    ".mod",
    ".sum",
    ".md",
    ".txt",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".cjs",
    ".css",
    ".html",
    ".env",
  ].includes(path.extname(filePath).toLowerCase());
}

function walk(
  startPath,
  visitor,
) {
  if (!existsSync(startPath)) {
    return;
  }
  try {
    readdirSync(startPath, { withFileTypes: true });
  } catch {
    return;
  }
  const stack = [startPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (visitor(nextPath, true) === "skip") {
          continue;
        }
        stack.push(nextPath);
        continue;
      }
      visitor(nextPath, false);
    }
  }
}

function syncRenameArtifacts(context) {
  const lockfilePath = path.join(context.repoRoot, "pnpm-lock.yaml");
  if (existsSync(lockfilePath)) {
    console.log("\n==> 同步 pnpm 锁文件");
    syncFrontendLockfile(context);
  }
}

function captureRenameSnapshot(context, files) {
  const snapshot = new Map();
  for (const rel of files) {
    const filePath = path.join(context.repoRoot, rel);
    snapshot.set(rel, readFileSync(filePath, "utf8"));
  }
  return snapshot;
}

function restoreRenameSnapshot(context, snapshot) {
  for (const [rel, original] of snapshot.entries()) {
    writeFileSync(path.join(context.repoRoot, rel), original, "utf8");
  }
}

function readOptionalFile(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, "utf8");
}

function restoreProfile(profilePath, previousProfile) {
  if (previousProfile === null) {
    rmSync(profilePath, { force: true });
    return;
  }
  writeFileSync(profilePath, previousProfile, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceBrandVariants(content, fromRoot, toRoot) {
  if (!fromRoot || fromRoot === toRoot) {
    return content;
  }

  const from = buildBrandVariants(fromRoot);
  const to = buildBrandVariants(toRoot);

  return content
    .replaceAll(from.kebab, to.kebab)
    .replaceAll(from.human, to.human)
    .replaceAll(from.upper, to.upper);
}

function buildBrandVariants(root) {
  const words = root
    .split(/[-_\s]+/g)
    .map((word) => word.trim())
    .filter(Boolean);
  const human = words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  return {
    kebab: root,
    human,
    upper: human.toUpperCase(),
  };
}
