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
        description={`租户：${tenantCode}`}
        eyebrow="Mobile Home"
        title={`你好，${info.name || info.userName}`}
      />

      <div className="mobile-grid">
        <ActionTile detail={`${profile.roles.length} 个角色`} title="角色" />
        <ActionTile detail={`${profile.posts.length} 个岗位`} title="岗位" />
        <ActionTile detail={`${info.permissions.length} 个权限`} title="权限" />
      </div>
    </div>
  );
}
