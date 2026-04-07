import type { AppMenuNode, RawMenuItem } from "@suiyuan/types";

function normalizePathSegment(path: string) {
  if (!path) {
    return "";
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
}

function joinPath(basePath: string, currentPath: string) {
  if (!currentPath) {
    return basePath || "/";
  }

  if (currentPath.startsWith("/")) {
    return currentPath;
  }

  const normalizedBase = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  return `${normalizedBase}${normalizePathSegment(currentPath)}` || "/";
}

function adaptMenuNode(menu: RawMenuItem, parentPath = ""): AppMenuNode | null {
  if (menu.menuType === "F") {
    return null;
  }

  const fullPath = joinPath(parentPath || "", menu.path || "");
  const children = (menu.children ?? [])
    .map((child) => adaptMenuNode(child, fullPath))
    .filter((item): item is AppMenuNode => item !== null);

  return {
    id: menu.menuId,
    title: menu.title || menu.menuName,
    icon: menu.icon,
    path: menu.path,
    fullPath: fullPath || "/",
    menuType: menu.menuType,
    permission: menu.permission,
    hidden: menu.visible === "1",
    breadcrumb: menu.breadcrumb,
    component: menu.component,
    children,
  };
}

export function adaptMenuTree(menuTree: RawMenuItem[]): AppMenuNode[] {
  return menuTree
    .map((menu) => adaptMenuNode(menu))
    .filter((item): item is AppMenuNode => item !== null);
}

export function flattenMenuTree(menuTree: AppMenuNode[]): AppMenuNode[] {
  return menuTree.flatMap((node: AppMenuNode) => [node, ...flattenMenuTree(node.children)]);
}

export function findMenuByPath(menuTree: AppMenuNode[], pathname: string): AppMenuNode | undefined {
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  return flattenMenuTree(menuTree).find((node: AppMenuNode) => {
    const nodePath = node.fullPath === "/" ? "/" : node.fullPath.replace(/\/$/, "");
    return nodePath === normalizedPath;
  });
}

export function countVisibleMenus(menuTree: AppMenuNode[]): number {
  return flattenMenuTree(menuTree).filter((node: AppMenuNode) => !node.hidden).length;
}

export function countLeafMenus(menuTree: AppMenuNode[]): number {
  return flattenMenuTree(menuTree).filter((node: AppMenuNode) => node.children.length === 0).length;
}
