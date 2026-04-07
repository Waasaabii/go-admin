import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CrudDataPage } from "../components/crud-data-page";
import { createApiClient } from "@suiyuan/api";
import type { SysOperaLogRecord } from "@suiyuan/types";

export function OperaLogsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const [detailId, setDetailId] = useState<number | null>(null);
  const detailQuery = useQuery({
    enabled: detailId !== null,
    queryKey: ["admin-page", "opera-log-detail", detailId],
    queryFn: () => api.admin.getOperaLog(detailId as number),
  });
  const detail = detailQuery.data;

  return (
    <>
      <CrudDataPage<SysOperaLogRecord>
        columns={[
        { label: "模块", render: (row) => row.title as string },
        { label: "请求方式", render: (row) => row.requestMethod as string },
        { label: "访问地址", render: (row) => row.operUrl as string },
        { label: "操作人", render: (row) => row.operName as string },
        { label: "状态", render: (row) => (row.status === "2" ? "正常" : "关闭") },
        { label: "耗时", render: (row) => row.latencyTime as string },
        { label: "时间", render: (row) => row.operTime as string },
        ]}
        deleteItem={(payload) => api.admin.deleteOperaLogs(payload)}
        description="操作日志已补详情查看，便于直接审阅请求参数、返回结果与执行环境。"
        fetcher={(params) => api.admin.listOperaLogs(params)}
        getRowId={(item) => Number(item.id)}
        queryKey="opera-logs"
        rowActions={(item) => (
          <button className="tiny-action" onClick={() => setDetailId(item.id)} type="button">
            详情
          </button>
        )}
        searchFields={[
        { key: "title", label: "模块", placeholder: "按模块过滤" },
        { key: "operUrl", label: "地址", placeholder: "按地址过滤" },
        { key: "status", label: "状态", placeholder: "1 或 2" },
        ]}
        title="操作日志"
      />
      {detailId !== null ? (
        <div className="modal-mask">
          <div className="modal-card detail-modal">
            <div className="detail-modal-head">
              <div>
                <h3>操作日志详情</h3>
                <p className="dialog-description">对应旧后台详细弹窗，当前保留高价值字段。</p>
              </div>
              <button className="soft-link" onClick={() => setDetailId(null)} type="button">
                关闭
              </button>
            </div>
            {detailQuery.isLoading ? <p className="empty-tip">正在加载详情...</p> : null}
            {detail ? (
              <div className="detail-section-stack">
                <div className="detail-grid wide">
                  <dt>请求地址</dt>
                  <dd>{detail.operUrl || "-"}</dd>
                  <dt>登录信息</dt>
                  <dd>{`${detail.operName || "-"} / ${detail.operIp || "-"} / ${detail.operLocation || "-"}`}</dd>
                  <dt>请求方式</dt>
                  <dd>{detail.requestMethod || "-"}</dd>
                  <dt>耗时</dt>
                  <dd>{detail.latencyTime || "-"}</dd>
                  <dt>操作状态</dt>
                  <dd>{detail.status === "2" ? "正常" : "关闭"}</dd>
                  <dt>操作时间</dt>
                  <dd>{detail.operTime || "-"}</dd>
                </div>
                <div>
                  <h4>请求参数</h4>
                  <pre className="json-panel">{detail.operParam || "-"}</pre>
                </div>
                <div>
                  <h4>返回结果</h4>
                  <pre className="json-panel">{detail.jsonResult || "-"}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
