import { SurfaceCard } from "@suiyuan/ui-mobile";
import type { InfoResponse, ProfileResponse } from "@suiyuan/types";

export function ProfilePage({ info, profile }: { info: InfoResponse; profile: ProfileResponse }) {
  return (
    <div className="mobile-stack">
      <SurfaceCard description="基本账号信息" title="账户信息">
        <dl className="mobile-detail-grid">
          <dt>用户名</dt>
          <dd>{info.userName}</dd>
          <dt>昵称</dt>
          <dd>{info.name || profile.user.nickName}</dd>
          <dt>手机号</dt>
          <dd>{profile.user.phone || "未设置"}</dd>
          <dt>邮箱</dt>
          <dd>{profile.user.email || "未设置"}</dd>
        </dl>
      </SurfaceCard>
      <SurfaceCard description="角色与岗位信息" title="角色与岗位">
        <dl className="mobile-detail-grid">
          <dt>角色</dt>
          <dd>{info.roles.join(" / ")}</dd>
          <dt>岗位</dt>
          <dd>{profile.posts.map((item) => item.postName).join(" / ") || "未配置"}</dd>
          <dt>权限数</dt>
          <dd>{info.permissions.length}</dd>
          <dt>说明</dt>
          <dd>{info.introduction}</dd>
        </dl>
      </SurfaceCard>
    </div>
  );
}
