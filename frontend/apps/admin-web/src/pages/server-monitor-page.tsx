import { useQuery } from "@tanstack/react-query";

import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";

export function ServerMonitorPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const monitorQuery = useQuery({
    queryKey: ["admin-page", "server-monitor"],
    queryFn: () => api.admin.getServerMonitor(),
    refetchInterval: 15000,
  });

  const metrics = monitorQuery.data || {};

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Admin Module</small>
        <h2>服务监控</h2>
        <p>这一页先保留关键指标与完整 JSON 观察视图，后续再升级成图形化监控面板。</p>
      </header>
      <div className="metric-grid">
        <article className="admin-card metric-card">
          <small>主机名</small>
          <strong>{String(metrics.hostName || "-")}</strong>
          <p>当前监控接口返回的主机名。</p>
        </article>
        <article className="admin-card metric-card">
          <small>IP</small>
          <strong>{String(metrics.ip || "-")}</strong>
          <p>当前环境出口或内网地址。</p>
        </article>
        <article className="admin-card metric-card">
          <small>CPU 使用率</small>
          <strong>{String(metrics.cpuUsed || "-")}</strong>
          <p>当前只做数值观察，不做趋势图。</p>
        </article>
        <article className="admin-card metric-card">
          <small>内存使用率</small>
          <strong>{String(metrics.memUsed || "-")}</strong>
          <p>来自现有服务监控接口。</p>
        </article>
      </div>
      <SectionCard title="完整响应" description="便于确认接口字段，后续可按真实结构拆成单独卡片。">
        <pre className="json-panel">{JSON.stringify(metrics, null, 2)}</pre>
      </SectionCard>
    </div>
  );
}
