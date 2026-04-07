import { SectionCard } from "@suiyuan/ui-admin";
import type { AppMenuNode } from "@suiyuan/types";

export function ModulePage({ currentMenu }: { currentMenu: AppMenuNode | undefined }) {
  if (!currentMenu) {
    return (
      <div className="page-stack">
        <header className="page-hero compact">
          <small>Route</small>
          <h2>页面未映射</h2>
          <p>当前路径已经进入新的后台壳子，但还没有绑定具体业务页面。</p>
        </header>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Module</small>
        <h2>{currentMenu.title}</h2>
        <p>
          该菜单已经完成动态路由接入。下一步只需要把原模块逻辑迁入这个路径，不需要再重复处理鉴权、导航和租户上下文。
        </p>
      </header>

      <div className="two-column-grid">
        <SectionCard title="当前路由上下文" description="用于逐模块迁移时快速确认挂载信息。">
          <dl className="detail-grid">
            <dt>完整路径</dt>
            <dd>{currentMenu.fullPath}</dd>
            <dt>菜单类型</dt>
            <dd>{currentMenu.menuType}</dd>
            <dt>权限标识</dt>
            <dd>{currentMenu.permission || "未配置"}</dd>
            <dt>组件标识</dt>
            <dd>{currentMenu.component || "未配置"}</dd>
          </dl>
        </SectionCard>
        <SectionCard title="迁移建议" description="把旧页面功能按模块注入到这里，不再回到旧前端架构。">
          <ul className="detail-list">
            <li>先接真实查询与提交接口，再替换占位说明。</li>
            <li>有子菜单时，继续拆成独立页面组件，不要堆在单页里。</li>
            <li>如果模块是工作流型页面，优先用卡片和状态分区，不要退回传统大表格布局。</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
