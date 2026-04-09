import { describe, expect, it } from "vitest";

import {
  createFileSlug,
  getWorkspaceRelativePath,
  resolveAutoDataAttributes,
  shouldSkipJsxName,
  toKebabCase,
} from "../../../build/auto-data-attrs";

const workspaceRoot = "/Users/wangshangbin/My/OrderProject/suiyuan";

describe("auto data attrs", () => {
  it("会生成稳定的 kebab-case 名称", () => {
    expect(toKebabCase("DropdownMenuTrigger")).toBe("dropdown-menu-trigger");
    expect(toKebabCase("React.Fragment")).toBe("react-fragment");
  });

  it("会输出工作区相对路径", () => {
    expect(
      getWorkspaceRelativePath(
        "/Users/wangshangbin/My/OrderProject/suiyuan/frontend/apps/admin-web/src/pages/login-page.tsx",
        workspaceRoot,
      ),
    ).toBe("frontend/apps/admin-web/src/pages/login-page.tsx");
  });

  it("会把应用和包源码路径压缩成短标识", () => {
    expect(createFileSlug("frontend/apps/admin-web/src/pages/login-page.tsx")).toBe("admin-web.pages.login-page");
    expect(createFileSlug("frontend/packages/ui-admin/src/primitives.tsx")).toBe("ui-admin.primitives");
  });

  it("会生成 data-node 和开发态 data-source", () => {
    expect(
      resolveAutoDataAttributes({
        column: 13,
        filename: "/Users/wangshangbin/My/OrderProject/suiyuan/frontend/apps/admin-web/src/pages/login-page.tsx",
        includeSource: true,
        line: 85,
        tagName: "Input",
        workspaceRoot,
      }),
    ).toEqual({
      dataNode: "admin-web.pages.login-page.input.l85c13",
      dataSource: "frontend/apps/admin-web/src/pages/login-page.tsx:85",
    });
  });

  it("会跳过 fragment 和 svg 相关节点", () => {
    expect(shouldSkipJsxName("Fragment")).toBe(true);
    expect(shouldSkipJsxName("React.Fragment")).toBe(true);
    expect(shouldSkipJsxName("svg")).toBe(true);
    expect(shouldSkipJsxName("path")).toBe(true);
    expect(shouldSkipJsxName("div")).toBe(false);
  });
});
