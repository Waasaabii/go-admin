import path from "node:path";

type SourceLocation = {
  column: number;
  line: number;
};

type AutoDataAttrsOptions = {
  includeSource?: boolean;
  workspaceRoot: string;
};

type ResolveAutoDataAttributesInput = {
  filename: string;
  includeSource?: boolean;
  tagName: string;
  workspaceRoot: string;
} & SourceLocation;

type BabelPluginApi = {
  types: {
    identifier(name: string): unknown;
    isJSXAttribute(node: unknown): boolean;
    jsxAttribute(name: unknown, value?: unknown): unknown;
    jsxExpressionContainer(expression: unknown): unknown;
    jsxIdentifier(name: string): unknown;
    jsxStringLiteral(value: string): unknown;
    memberExpression(object: unknown, property: unknown): unknown;
    stringLiteral(value: string): unknown;
  };
};

type BabelNodePath = {
  findParent(callback: (currentPath: BabelNodePath) => boolean): BabelNodePath | null;
  node: {
    attributes?: unknown[];
    loc?: {
      start: SourceLocation;
    };
    name?: unknown;
    openingElement?: {
      name?: unknown;
    };
  };
};

type BabelState = {
  filename?: string;
};

const SVG_ELEMENT_NAMES = new Set([
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "g",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "svg",
  "symbol",
  "text",
  "textPath",
  "title",
  "tspan",
  "use",
]);

function normalizePath(value: string) {
  return value.replace(/\\/g, "/");
}

function trimExtension(value: string) {
  return value.replace(/\.[^.]+$/, "");
}

export function toKebabCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

export function getWorkspaceRelativePath(filename: string, workspaceRoot: string) {
  const normalizedFile = normalizePath(path.resolve(filename));
  const normalizedRoot = normalizePath(path.resolve(workspaceRoot));
  const relative = normalizePath(path.relative(normalizedRoot, normalizedFile));
  return relative.startsWith("../") ? normalizedFile : relative;
}

export function createFileSlug(relativePath: string) {
  const normalized = normalizePath(trimExtension(relativePath));
  const segments = normalized.split("/").filter(Boolean);

  if (segments[0] === "frontend" && segments[1] === "apps" && segments[3] === "src") {
    return [segments[2], ...segments.slice(4)].map(toKebabCase).join(".");
  }

  if (segments[0] === "frontend" && segments[1] === "packages" && segments[3] === "src") {
    return [segments[2], ...segments.slice(4)].map(toKebabCase).join(".");
  }

  return segments.map(toKebabCase).join(".");
}

export function getJsxName(name: unknown): string | null {
  if (!name || typeof name !== "object") {
    return null;
  }

  if ("name" in name && typeof name.name === "string") {
    return name.name;
  }

  if ("object" in name && "property" in name) {
    const objectName = getJsxName(name.object);
    const propertyName = getJsxName(name.property);
    return objectName && propertyName ? `${objectName}.${propertyName}` : null;
  }

  if ("namespace" in name && "name" in name) {
    const namespaceName = getJsxName(name.namespace);
    const localName = getJsxName(name.name);
    return namespaceName && localName ? `${namespaceName}:${localName}` : null;
  }

  return null;
}

export function shouldSkipJsxName(name: string) {
  return name === "Fragment" || name === "React.Fragment" || SVG_ELEMENT_NAMES.has(name);
}

export function resolveAutoDataAttributes({
  column,
  filename,
  includeSource,
  line,
  tagName,
  workspaceRoot,
}: ResolveAutoDataAttributesInput) {
  const relativePath = getWorkspaceRelativePath(filename, workspaceRoot);
  const fileSlug = createFileSlug(relativePath);
  const normalizedTag = toKebabCase(tagName);
  const dataNode = `${fileSlug}.${normalizedTag}.l${line}c${column}`;

  return {
    dataNode,
    dataSource: includeSource ? `${relativePath}:${line}` : undefined,
  };
}

function hasAttribute(attributes: unknown[], attributeName: string, isJsxAttribute: (node: unknown) => boolean) {
  return attributes.some((attribute) => {
    if (!isJsxAttribute(attribute)) {
      return false;
    }
    return (
      typeof attribute === "object" &&
      attribute !== null &&
      "name" in attribute &&
      typeof attribute.name === "object" &&
      attribute.name !== null &&
      "name" in attribute.name &&
      attribute.name.name === attributeName
    );
  });
}

function isInsideSvg(pathNode: BabelNodePath) {
  return Boolean(
    pathNode.findParent((currentPath) => {
      if (!currentPath.node || typeof currentPath.node !== "object" || !("openingElement" in currentPath.node)) {
        return false;
      }
      const name = getJsxName(currentPath.node.openingElement?.name);
      return Boolean(name && SVG_ELEMENT_NAMES.has(name));
    }),
  );
}

export function createAutoDataAttrsBabelPlugin(options: AutoDataAttrsOptions) {
  return function autoDataAttrsBabelPlugin(api: BabelPluginApi) {
    const { types: t } = api;

    return {
      name: "go-admin-auto-data-attrs",
      visitor: {
        JSXOpeningElement(pathNode: BabelNodePath, state: BabelState) {
          const filename = state.filename;
          const location = pathNode.node.loc?.start;
          const tagName = getJsxName(pathNode.node.name);
          const attributes = pathNode.node.attributes ?? (pathNode.node.attributes = []);

          if (!filename || !location || !tagName || shouldSkipJsxName(tagName) || isInsideSvg(pathNode)) {
            return;
          }

          const { dataNode, dataSource } = resolveAutoDataAttributes({
            column: location.column + 1,
            filename,
            includeSource: options.includeSource,
            line: location.line,
            tagName,
            workspaceRoot: options.workspaceRoot,
          });

          if (!hasAttribute(attributes, "data-node", t.isJSXAttribute)) {
            attributes.push(
              t.jsxAttribute(t.jsxIdentifier("data-node"), t.stringLiteral(dataNode)),
            );
          }

          if (dataSource && !hasAttribute(attributes, "data-source", t.isJSXAttribute)) {
            attributes.push(
              t.jsxAttribute(t.jsxIdentifier("data-source"), t.stringLiteral(dataSource)),
            );
          }
        },
      },
    };
  };
}
