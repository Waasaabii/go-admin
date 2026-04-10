import path from "node:path";

export function printSection(title) {
  console.log(`==> ${title}`);
}

export function printField(label, value, indent = "  ") {
  console.log(`${indent}${label}: ${value}`);
}

export function printFields(entries, indent = "  ") {
  for (const [label, value] of entries) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    printField(label, value, indent);
  }
}

export function printHint(value) {
  console.log(`  ${value}`);
}

export function printDivider() {
  console.log("");
}

export function toRepoRelative(context, targetPath) {
  if (!targetPath) {
    return "";
  }
  const relative = path.relative(context.repoRoot, targetPath);
  return relative && !relative.startsWith("..") ? relative : targetPath;
}

export function formatCommand(command, args = []) {
  return [command, ...args].join(" ").trim();
}
