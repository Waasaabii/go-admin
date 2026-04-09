import { countLeafMenus, countVisibleMenus, flattenMenuTree } from "@suiyuan/core";
import { AdminPageStack, AdminTwoColumn, MetricCard, MetricGrid, PageHeader, SectionCard } from "@suiyuan/ui-admin";
import type { AppMenuNode, InfoResponse, ProfileResponse } from "@suiyuan/types";

export function DashboardPage({
  info,
  menuTree,
  profile,
  tenantCode,
}: {
  info: InfoResponse;
  menuTree: AppMenuNode[];
  profile: ProfileResponse;
  tenantCode: string;
}) {
  const flattened = flattenMenuTree(menuTree);

  return (
    <AdminPageStack>
      <PageHeader
        description={`租户：${tenantCode}`}
        kicker="Console Overview"
        title={`${info.name || info.userName} 的工作台`}
      />

      <MetricGrid>
        <MetricCard label="可见导航" value={String(countVisibleMenus(menuTree))} detail="菜单项总数" />
        <MetricCard label="叶子模块" value={String(countLeafMenus(menuTree))} detail="末级页面数" />
        <MetricCard label="权限点" value={String(info.permissions.length)} detail="已授权操作数" />
        <MetricCard label="岗位数" value={String(profile.posts.length)} detail="所属岗位数" />
      </MetricGrid>

      <AdminTwoColumn>
        <SectionCard title="快捷入口" description="常用功能模块">
          <div className="flex flex-wrap gap-3">
            {flattened.slice(0, 6).map((node) => (
              <span className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground" key={node.id}>
                {node.title}
              </span>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="功能模块" description="已加载的导航菜单">
          <div className="flex flex-wrap gap-3">
            {flattened.slice(6, 12).map((node) => (
              <span className="rounded-full bg-secondary px-4 py-2 text-sm text-secondary-foreground" key={node.id}>
                {node.title}
              </span>
            ))}
          </div>
        </SectionCard>
      </AdminTwoColumn>
    </AdminPageStack>
  );
}
