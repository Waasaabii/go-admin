import { AdminPageStack, AdminTwoColumn, DetailGrid, PageHeader, SectionCard } from "@go-admin/ui-admin";
import type { AppMenuNode } from "@go-admin/types";

export function ModulePage({ currentMenu }: { currentMenu: AppMenuNode | undefined }) {
  if (!currentMenu) {
    return (
      <AdminPageStack>
        <PageHeader description="该菜单尚未绑定页面组件。" kicker="Route" title="页面未映射" />
      </AdminPageStack>
    );
  }

  return (
    <AdminPageStack>
      <PageHeader
        description={currentMenu.fullPath}
        kicker="Module"
        title={currentMenu.title}
      />

      <AdminTwoColumn>
        <SectionCard title="路由信息" description="当前菜单的挂载信息">
          <DetailGrid
            items={[
              { label: "完整路径", value: currentMenu.fullPath },
              { label: "菜单类型", value: currentMenu.menuType },
              { label: "权限标识", value: currentMenu.permission || "未配置" },
              { label: "组件标识", value: currentMenu.component || "未配置" },
            ]}
          />
        </SectionCard>
      </AdminTwoColumn>
    </AdminPageStack>
  );
}
