import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

export function loadState(context) {
  ensureDir(path.dirname(context.statePath));
  if (!existsSync(context.statePath)) {
    return { services: {} };
  }
  const data = readFileSync(context.statePath, "utf8");
  if (!data.trim()) {
    return { services: {} };
  }
  try {
    const payload = JSON.parse(data);
    return { services: payload.services ?? {} };
  } catch (error) {
    const brokenPath = `${context.statePath}.broken-${Date.now()}`;
    renameSync(context.statePath, brokenPath);
    console.error(`检测到损坏的状态文件，已迁移到 ${brokenPath}: ${error instanceof Error ? error.message : String(error)}`);
    return { services: {} };
  }
}

export function updateState(context, mutator) {
  const state = loadState(context);
  mutator(state);
  writeState(context, state);
  return state;
}

export function saveProfile(context, projectPrefix) {
  ensureDir(path.dirname(context.profilePath));
  writeFileSync(context.profilePath, `${JSON.stringify({ project_prefix: projectPrefix }, null, 2)}\n`, "utf8");
}

export function removeProfile(context) {
  if (existsSync(context.profilePath)) {
    rmSync(context.profilePath, { force: true });
  }
}

export function nowRFC3339() {
  return new Date().toISOString();
}

function writeState(context, state) {
  ensureDir(path.dirname(context.statePath));
  writeFileSync(context.statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}
