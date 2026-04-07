import { countLeafMenus, countVisibleMenus, flattenMenuTree } from "@suiyuan/core";
import { MetricCard, MetricGrid, SectionCard } from "@suiyuan/ui-admin";
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
    <div className="page-stack">
      <header className="page-hero">
        <small>Console Overview</small>
        <h2>{info.name || info.userName} 的工作台</h2>
        <p>
          当前租户为 {tenantCode}，系统已接入现有动态菜单、角色权限和个人资料接口。第一阶段先让旧后台能力平移到
          React + Vite，再逐步做模块深改。
        </p>
      </header>

      <MetricGrid>
        <MetricCard label="可见导航" value={String(countVisibleMenus(menuTree))} detail="后台正在按现有 sys_menu 动态驱动。" />
        <MetricCard label="叶子模块" value={String(countLeafMenus(menuTree))} detail="用于评估后续逐页迁移的实际页面规模。" />
        <MetricCard label="权限点" value={String(info.permissions.length)} detail="沿用当前后端按钮和权限点集合。" />
        <MetricCard label="岗位数" value={String(profile.posts.length)} detail="个人中心返回的岗位会保留给后续工作流定制使用。" />
      </MetricGrid>

      <div className="two-column-grid">
        <SectionCard title="迁移原则" description="后台保持菜单树，但视觉和信息密度整体升级为工作台风格。">
          <ul className="detail-list">
            <li>复用现有登录、退出、刷新 token、getinfo、menurole 链路。</li>
            <li>动态菜单先做通用模块壳，后续按业务逐页替换。</li>
            <li>租户通过域名/子域识别，前端统一携带租户标识和终端标识。</li>
          </ul>
        </SectionCard>
        <SectionCard title="最近就绪模块" description="以下菜单已经被新前端识别，可直接作为后续页面迁移入口。">
          <div className="tag-cloud">
            {flattened.slice(0, 12).map((node) => (
              <span className="chip" key={node.id}>
                {node.title}
              </span>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
