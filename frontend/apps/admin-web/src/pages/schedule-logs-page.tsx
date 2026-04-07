import { useState } from "react";

import { CrudDataPage } from "../components/crud-data-page";
import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";
import type { SysJobLogRecord } from "@suiyuan/types";

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

export function ScheduleLogsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const [detail, setDetail] = useState<SysJobLogRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function openDetail(item: SysJobLogRecord) {
    setDetailLoading(true);
    try {
      const response = await api.jobs.getJobLog(item.id);
      setDetail(response);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <>
      <CrudDataPage<SysJobLogRecord>
        columns={[
          { label: "任务名称", render: (row) => row.jobName || "-" },
          { label: "分组", render: (row) => row.jobGroup || "-" },
          { label: "类型", render: (row) => (row.jobType === 2 ? "函数调用" : "HTTP") },
          { label: "调用目标", render: (row) => row.invokeTarget || "-" },
          { label: "状态", render: (row) => (row.status === 2 ? "成功" : "失败") },
          { label: "耗时", render: (row) => `${row.durationMs || 0} ms` },
          { label: "开始时间", render: (row) => formatDateTime(row.startTime) },
          { label: "结束时间", render: (row) => formatDateTime(row.endTime) },
          {
            label: "消息摘要",
            render: (row) => <span className="table-message">{row.message || "-"}</span>,
          },
        ]}
        description="调度日志已经接到真实后端执行记录，可直接查看任务执行结果和失败摘要。"
        fetcher={(params) => api.jobs.listJobLogs(params)}
        getRowId={(item) => item.id}
        queryKey="schedule-job-logs"
        renderAside={() => (
          <SectionCard title="日志说明" description="当前日志按任务最终执行结果落库，不记录每次 HTTP 重试中间态。">
            <ul className="detail-list">
              <li>成功和失败都会落日志，失败消息来自最终异常或执行器缺失。</li>
              <li>日志页只读，不提供删除和编辑，避免误抹排障线索。</li>
              <li>如果需要完整消息体，可通过“详情”弹窗查看完整记录。</li>
            </ul>
          </SectionCard>
        )}
        rowActions={(item) => (
          <button className="tiny-action" onClick={() => void openDetail(item)} type="button">
            详情
          </button>
        )}
        searchFields={[
          { key: "jobName", label: "任务名称", placeholder: "按任务名称过滤" },
          { key: "jobGroup", label: "任务分组", placeholder: "如 DEFAULT" },
          { key: "status", label: "状态", placeholder: "输入 1 或 2" },
        ]}
        title="调度日志"
      />

      {detail || detailLoading ? (
        <div className="modal-mask">
          <div className="modal-card">
            <div className="detail-modal-head">
              <div>
                <h3>{detail?.jobName || "调度日志详情"}</h3>
                <p className="dialog-description">这里展示单次调度执行的完整结果，用于定位失败原因和耗时问题。</p>
              </div>
              <button className="soft-link" onClick={() => setDetail(null)} type="button">
                关闭
              </button>
            </div>
            {detailLoading ? <p className="empty-tip">正在加载日志详情...</p> : null}
            {detail ? (
              <div className="detail-section-stack">
                <dl className="detail-grid">
                  <dt>任务名称</dt>
                  <dd>{detail.jobName}</dd>
                  <dt>任务分组</dt>
                  <dd>{detail.jobGroup || "-"}</dd>
                  <dt>任务类型</dt>
                  <dd>{detail.jobType === 2 ? "函数调用" : "HTTP"}</dd>
                  <dt>执行状态</dt>
                  <dd>{detail.status === 2 ? "成功" : "失败"}</dd>
                  <dt>执行耗时</dt>
                  <dd>{detail.durationMs} ms</dd>
                  <dt>EntryId</dt>
                  <dd>{detail.entryId || 0}</dd>
                  <dt>开始时间</dt>
                  <dd>{formatDateTime(detail.startTime)}</dd>
                  <dt>结束时间</dt>
                  <dd>{formatDateTime(detail.endTime)}</dd>
                </dl>
                <div>
                  <h4>调用信息</h4>
                  <p className="dialog-description">{detail.invokeTarget || "-"}</p>
                  <p className="cell-subline">{detail.cronExpression || "-"}</p>
                </div>
                <div>
                  <h4>完整消息</h4>
                  <pre className="log-detail-box">{detail.message || "无消息"}</pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
