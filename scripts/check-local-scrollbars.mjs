import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetDirs = [
  "frontend/packages/ui-admin/src",
  "frontend/apps/admin-web/src",
  "frontend/apps/ui-showcase/src",
];
const validExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css"]);
const overflowPattern = /\boverflow(?:-[xy])?-auto\b/g;
const inlineAllowMarker = "scroll-rule: allow-local-overflow";
const allowlist = new Map([
  [
    "frontend/apps/ui-showcase/src/app.tsx",
    [
      'contentClassName="px-4 py-6 md:px-8 md:py-8 xl:min-h-0 xl:overflow-y-auto"',
    ],
  ],
]);

async function collectFiles(dir) {
  const fullDir = path.join(repoRoot, dir);
  const entries = await readdir(fullDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const nextRelative = path.posix.join(dir.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(nextRelative)));
      continue;
    }

    if (validExtensions.has(path.extname(entry.name))) {
      files.push(nextRelative);
    }
  }

  return files;
}

function isAllowed(relativePath, line, previousLine) {
  const allowedSnippets = allowlist.get(relativePath);
  if (allowedSnippets?.some((snippet) => line.includes(snippet))) {
    return true;
  }

  return line.includes(inlineAllowMarker) || previousLine.includes(inlineAllowMarker);
}

const violations = [];

for (const dir of targetDirs) {
  const files = await collectFiles(dir);
  for (const relativePath of files) {
    const fullPath = path.join(repoRoot, relativePath);
    const content = await readFile(fullPath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      overflowPattern.lastIndex = 0;
      if (!overflowPattern.test(line)) {
        return;
      }

      const previousLine = index > 0 ? lines[index - 1] : "";
      if (isAllowed(relativePath, line, previousLine)) {
        return;
      }

      violations.push({
        line: index + 1,
        path: relativePath,
        text: line.trim(),
      });
    });
  }
}

if (violations.length > 0) {
  console.error("检测到未通过白名单的局部裸滚动写法，请改用公共组件或 AppScrollbar：");
  for (const violation of violations) {
    console.error(`- ${violation.path}:${violation.line}`);
    console.error(`  ${violation.text}`);
  }
  process.exit(1);
}

console.log("局部滚动规则检查通过。");
