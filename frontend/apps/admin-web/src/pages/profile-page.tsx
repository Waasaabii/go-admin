import { SectionCard } from "@suiyuan/ui-admin";
import type { InfoResponse, ProfileResponse } from "@suiyuan/types";

export function ProfilePage({ info, profile }: { info: InfoResponse; profile: ProfileResponse }) {
  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Account</small>
        <h2>个人中心</h2>
        <p>这里直接复用现有 `/api/v1/getinfo` 与 `/api/v1/user/profile` 数据。</p>
      </header>

      <div className="two-column-grid">
        <SectionCard title="账号信息" description="用于确认后端登录态、角色和租户上下文已经打通。">
          <dl className="detail-grid">
            <dt>用户名</dt>
            <dd>{info.userName}</dd>
            <dt>显示名</dt>
            <dd>{info.name}</dd>
            <dt>部门 ID</dt>
            <dd>{info.deptId}</dd>
            <dt>角色</dt>
            <dd>{info.roles.join(" / ")}</dd>
          </dl>
        </SectionCard>
        <SectionCard title="联系与岗位" description="后续移动端和后台端都可复用这部分用户基础信息。">
          <dl className="detail-grid">
            <dt>手机号</dt>
            <dd>{profile.user.phone || "未设置"}</dd>
            <dt>邮箱</dt>
            <dd>{profile.user.email || "未设置"}</dd>
            <dt>岗位</dt>
            <dd>{profile.posts.map((post) => post.postName).join(" / ") || "未配置"}</dd>
            <dt>备注</dt>
            <dd>{profile.user.remark || "暂无备注"}</dd>
          </dl>
        </SectionCard>
      </div>
    </div>
  );
}
