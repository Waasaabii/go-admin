import { ActionTile, MobileHero, SurfaceCard } from "@suiyuan/ui-mobile";
import type { InfoResponse, ProfileResponse } from "@suiyuan/types";

export function HomePage({
  info,
  profile,
  tenantCode,
}: {
  info: InfoResponse;
  profile: ProfileResponse;
  tenantCode: string;
}) {
  return (
    <div className="mobile-stack">
      <MobileHero
        description={`当前租户 ${tenantCode}，已完成账号、会话恢复和基础资料链路对接。下一阶段把原有用户端页面逐步迁入这个壳子。`}
        eyebrow="Mobile Home"
        title={`你好，${info.name || info.userName}`}
      />

      <div className="mobile-grid">
        <ActionTile detail="移动端第一阶段先把认证、租户与资料链路稳定下来。" title="迁移总览" />
        <ActionTile detail={`${profile.roles.length} 个角色 / ${profile.posts.length} 个岗位`} title="身份信息" />
        <ActionTile detail={`${info.permissions.length} 个权限点已同步`} title="权限同步" />
        <ActionTile detail="后续会承接原用户端业务页面" title="业务待迁移" />
      </div>

      <SurfaceCard description="当前移动端是用户端骨架，后续直接在此承接真实流程页面。" title="近期任务">
        <ul className="mobile-list">
          <li>逐步迁移已有用户端页面，不与后台页面强行复用。</li>
          <li>保留账号与租户上下文，后续切入订单、进度、资料等模块。</li>
          <li>在移动场景保持单手操作和短路径交互，不回退为桌面式信息堆叠。</li>
        </ul>
      </SurfaceCard>
    </div>
  );
}
