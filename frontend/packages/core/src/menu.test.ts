import { describe, expect, it } from "vitest";

import { adaptMenuTree, countLeafMenus, countVisibleMenus, findMenuByPath } from "./menu";
import { deriveTenantCode } from "./tenant";

describe("deriveTenantCode", () => {
  it("在子域名场景下提取租户编码", () => {
    expect(deriveTenantCode("alpha.example.com").tenantCode).toBe("alpha");
  });

  it("在 localhost 场景下回退到默认租户", () => {
    expect(deriveTenantCode("localhost", "dev").tenantCode).toBe("dev");
  });
});

describe("adaptMenuTree", () => {
  const menus = adaptMenuTree([
    {
      menuId: 1,
      menuName: "workbench",
      title: "工作台",
      icon: "dashboard",
      path: "workbench",
      paths: "/0/1",
      menuType: "M",
      action: "list",
      permission: "dashboard:view",
      parentId: 0,
      noCache: false,
      breadcrumb: "0",
      component: "layout",
      sort: 1,
      visible: "0",
      isFrame: "0",
      children: [
        {
          menuId: 2,
          menuName: "board",
          title: "运营看板",
          icon: "line-chart",
          path: "board",
          paths: "/0/1/2",
          menuType: "C",
          action: "list",
          permission: "board:view",
          parentId: 1,
          noCache: false,
          breadcrumb: "0",
          component: "board/index",
          sort: 1,
          visible: "0",
          isFrame: "0",
        },
      ],
    },
  ]);

  it("拼接完整菜单路径", () => {
    expect(findMenuByPath(menus, "/workbench/board")?.title).toBe("运营看板");
  });

  it("统计可见菜单和叶子菜单", () => {
    expect(countVisibleMenus(menus)).toBe(2);
    expect(countLeafMenus(menus)).toBe(1);
  });
});
