import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CrudDataPage } from "../components/crud-data-page";
import { createApiClient } from "@suiyuan/api";
import type { SysLoginLogRecord } from "@suiyuan/types";

export function LoginLogsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const detailQuery = useQuery({
    enabled: detailId !== null,
    queryKey: ["admin-page", "login-log-detail", detailId],
    queryFn: () => api.admin.getLoginLog(detailId as number),
  });
  const detail = detailQuery.data;

  return (
    <>
      <CrudDataPage<SysLoginLogRecord>
        columns={[
        { label: "用户名", render: (row) => row.username as string },
        { label: "状态", render: (row) => ((row.status as string) === "2" ? "成功" : "失败") },
        { label: "IP", render: (row) => row.ipaddr as string },
        { label: "浏览器", render: (row) => row.browser as string },
        { label: "系统", render: (row) => row.os as string },
        { label: "登录时间", render: (row) => row.loginTime as string },
        { label: "消息", render: (row) => row.msg as string },
        ]}
        deleteItem={(payload) => api.admin.deleteLoginLogs(payload)}
        description="登录日志已经补上详情查看入口，先做清晰审阅，不扩展导出与批量分析。"
        fetcher={(params) => api.admin.listLoginLogs(params)}
        getRowId={(item) => Number(item.id)}
        queryKey="login-logs"
        rowActions={(item) => (
          <button className="tiny-action" onClick={() => setDetailId(item.id)} type="button">
            详情
          </button>
        )}
        searchFields={[
        { key: "username", label: "用户名", placeholder: "按用户名过滤" },
        { key: "ipaddr", label: "IP", placeholder: "按 IP 过滤" },
        { key: "status", label: "状态", placeholder: "1 或 2" },
        ]}
        title="登录日志"
      />
      {detailId !== null ? (
        <div className="modal-mask">
          <div className="modal-card detail-modal">
            <div className="detail-modal-head">
              <div>
                <h3>登录日志详情</h3>
                <p className="dialog-description">查看单条登录记录的环境与结果信息。</p>
              </div>
              <button className="soft-link" onClick={() => setDetailId(null)} type="button">
                关闭
              </button>
            </div>
            {detailQuery.isLoading ? <p className="empty-tip">正在加载详情...</p> : null}
            {detail ? (
              <div className="detail-grid wide">
                <dt>用户名</dt>
                <dd>{detail.username || "-"}</dd>
                <dt>状态</dt>
                <dd>{detail.status === "2" ? "成功" : "失败"}</dd>
                <dt>IP</dt>
                <dd>{detail.ipaddr || "-"}</dd>
                <dt>归属地</dt>
                <dd>{detail.loginLocation || "-"}</dd>
                <dt>浏览器</dt>
                <dd>{detail.browser || "-"}</dd>
                <dt>系统</dt>
                <dd>{detail.os || "-"}</dd>
                <dt>平台</dt>
                <dd>{detail.platform || "-"}</dd>
                <dt>登录时间</dt>
                <dd>{detail.loginTime || "-"}</dd>
                <dt>消息</dt>
                <dd>{detail.msg || "-"}</dd>
                <dt>备注</dt>
                <dd>{detail.remark || "-"}</dd>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
