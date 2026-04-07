import { SurfaceCard } from "@suiyuan/ui-mobile";

export function StatusPage() {
  return (
    <div className="mobile-stack">
      <SurfaceCard description="后续用来承接订单进度、服务状态、通知提醒等移动端高频页面。" title="状态中心">
        <ul className="mobile-list">
          <li>状态页先做成独立标签，不和首页混在一起。</li>
          <li>等真实业务 API 就绪后，再替换占位内容。</li>
          <li>移动端的状态页优先做时间线、卡片和结果态，不做后台式表格。</li>
        </ul>
      </SurfaceCard>
    </div>
  );
}
