import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { readDevPorts } from "../../../scripts/dev-ports";
import { createAutoDataAttrsBabelPlugin } from "../../build/auto-data-attrs";

const { DEV_SHOWCASE_PORT } = readDevPorts();
const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));

function normalizeBase(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized === ".") {
    return "/";
  }

  if (/^https?:\/\//.test(normalized)) {
    return normalized.endsWith("/") ? normalized : `${normalized}/`;
  }

  const withLeadingSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function resolveShowcaseBase() {
  const explicitBase = process.env.VITE_SHOWCASE_BASE || process.env.VITE_PUBLIC_BASE;
  if (explicitBase) {
    return normalizeBase(explicitBase);
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    return "/";
  }

  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    return "/";
  }

  if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return "/";
  }

  return normalizeBase(repo);
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? resolveShowcaseBase() : "/",
  plugins: [
    react({
      babel: {
        plugins: [
          [
            createAutoDataAttrsBabelPlugin({
              includeSource: command !== "build" || process.env.VITE_INCLUDE_DATA_SOURCE === "true",
              workspaceRoot,
            }),
          ],
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: DEV_SHOWCASE_PORT,
  },
}));
