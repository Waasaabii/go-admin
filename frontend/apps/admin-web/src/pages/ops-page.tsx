import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError, createApiClient } from "@suiyuan/api";
import { SectionCard } from "@suiyuan/ui-admin";
import type {
  CommitInfo,
  CreateOpsTaskPayload,
  OpsDoneEvent,
  OpsEnvironmentItem,
  OpsErrorEvent,
  OpsTaskDetail,
  OpsTaskListItem,
  OpsTaskStatus,
  OpsTaskType,
} from "@suiyuan/types";

const actionMeta: Record<OpsTaskType, { label: string; accent: "primary" | "soft" }> = {
  deploy_backend: { label: "发布后端", accent: "soft" },
  deploy_frontend: { label: "发布前端", accent: "soft" },
  deploy_all: { label: "全部发布", accent: "primary" },
  restart_backend: { label: "重启后端", accent: "soft" },
};

const statusText: Record<OpsTaskStatus, string> = {
  queued: "排队中",
  running: "执行中",
  success: "成功",
  failed: "失败",
  cancelled: "已取消",
};

const envStatusText = {
  healthy: "环境健康",
  unhealthy: "健康检查失败",
  disabled: "环境已禁用",
};

type ConfirmState = {
  env: OpsEnvironmentItem;
  type: OpsTaskType;
};

type StreamSnapshot = {
  status: OpsTaskStatus;
  step: number;
  totalSteps: number;
  stepName: string;
  log: string;
  lastOffset: number;
  done?: OpsDoneEvent;
  error?: OpsErrorEvent;
};

export function OpsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmValue, setConfirmValue] = useState("");
  const [expandedCommitKey, setExpandedCommitKey] = useState<string | null>(null);
  const [viewerTaskId, setViewerTaskId] = useState<number | null>(null);
  const [streamState, setStreamState] = useState<StreamSnapshot | null>(null);

  const environmentsQuery = useQuery({
    queryKey: ["admin", "ops", "environments"],
    queryFn: () => api.ops.getEnvironments(),
    refetchInterval: (query) => {
      const list = query.state.data as OpsEnvironmentItem[] | undefined;
      return list?.some((item) => item.runningTask) ? 5000 : 30000;
    },
  });

  const tasksQuery = useQuery({
    queryKey: ["admin", "ops", "tasks", "recent"],
    queryFn: () => api.ops.getTasks({ pageIndex: 1, pageSize: 20 }),
    refetchInterval: 30000,
  });

  const taskDetailQuery = useQuery({
    enabled: viewerTaskId !== null,
    queryKey: ["admin", "ops", "task", viewerTaskId],
    queryFn: () => api.ops.getTask(viewerTaskId!),
    refetchInterval: (query) => {
      const task = query.state.data as OpsTaskDetail | undefined;
      if (!task) {
        return false;
      }
      return task.status === "queued" || task.status === "running" ? 5000 : false;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: CreateOpsTaskPayload) => api.ops.createTask(payload),
    onSuccess: async (result) => {
      setViewerTaskId(result.id);
      setConfirmState(null);
      setConfirmValue("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "ops", "environments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "ops", "tasks"] }),
      ]);
    },
  });

  const cancelTaskMutation = useMutation({
    mutationFn: (taskId: number) => api.ops.cancelTask(taskId),
    onSuccess: async (_, taskId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "ops", "environments"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "ops", "tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "ops", "task", taskId] }),
      ]);
    },
  });

  useEffect(() => {
    const task = taskDetailQuery.data;
    if (!task) {
      return;
    }
    setStreamState({
      status: task.status,
      step: task.step,
      totalSteps: task.totalSteps,
      stepName: task.stepName,
      log: task.log,
      lastOffset: Array.from(task.log).length,
      done:
        task.status === "success"
          ? {
              status: task.status,
              summary: task.summary,
              duration: formatDuration(task.startedAt, task.finishedAt),
              domain: findEnvByKey(environmentsQuery.data, task.env)?.domain || "",
            }
          : undefined,
      error:
        task.status === "failed" || task.status === "cancelled"
          ? {
              status: task.status,
              step: task.step,
              stepName: task.stepName,
              errMsg: task.errMsg,
              suggestion: task.suggestion,
            }
          : undefined,
    });
    if (task.status !== "queued" && task.status !== "running") {
      return;
    }
    const disconnect = api.ops.connectTaskStream(task.id, {
      lastLogOffset: Array.from(task.log).length,
      onStatus: (payload) => {
        setStreamState((current) => ({
          status: payload.status,
          step: payload.step,
          totalSteps: payload.totalSteps,
          stepName: payload.stepName,
          log: current?.log || task.log,
          lastOffset: current?.lastOffset ?? Array.from(task.log).length,
          done: current?.done,
          error: current?.error,
        }));
      },
      onLog: (payload) => {
        setStreamState((current) => ({
          status: current?.status || task.status,
          step: current?.step ?? task.step,
          totalSteps: current?.totalSteps ?? task.totalSteps,
          stepName: current?.stepName || task.stepName,
          log: `${current?.log || task.log}${payload.line}`,
          lastOffset: payload.offset,
          done: current?.done,
          error: current?.error,
        }));
      },
      onDone: async (payload) => {
        setStreamState((current) => ({
          status: payload.status,
          step: current?.totalSteps ?? task.totalSteps,
          totalSteps: current?.totalSteps ?? task.totalSteps,
          stepName: current?.stepName || task.stepName,
          log: current?.log || task.log,
          lastOffset: current?.lastOffset ?? Array.from(task.log).length,
          done: payload,
          error: undefined,
        }));
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["admin", "ops", "environments"] }),
          queryClient.invalidateQueries({ queryKey: ["admin", "ops", "tasks"] }),
          queryClient.invalidateQueries({ queryKey: ["admin", "ops", "task", task.id] }),
        ]);
      },
      onError: async (payload) => {
        setStreamState((current) => ({
          status: payload.status,
          step: payload.step,
          totalSteps: current?.totalSteps ?? task.totalSteps,
          stepName: payload.stepName,
          log: current?.log || task.log,
          lastOffset: current?.lastOffset ?? Array.from(task.log).length,
          done: undefined,
          error: payload,
        }));
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["admin", "ops", "environments"] }),
          queryClient.invalidateQueries({ queryKey: ["admin", "ops", "tasks"] }),
          queryClient.invalidateQueries({ queryKey: ["admin", "ops", "task", task.id] }),
        ]);
      },
      onTransportError: (error) => {
        setStreamState((current) => ({
          status: current?.status || task.status,
          step: current?.step ?? task.step,
          totalSteps: current?.totalSteps ?? task.totalSteps,
          stepName: current?.stepName || task.stepName,
          log: `${current?.log || task.log}\n[stream] ${error.message}\n`,
          lastOffset: current?.lastOffset ?? Array.from(task.log).length,
          done: current?.done,
          error: current?.error,
        }));
      },
    });
    return disconnect;
  }, [api.ops, environmentsQuery.data, queryClient, taskDetailQuery.data]);

  async function handleCreateTask(env: OpsEnvironmentItem, type: OpsTaskType, confirmName?: string) {
    try {
      await createTaskMutation.mutateAsync({
        env: env.key,
        type,
        confirmName,
      });
    } catch (error) {
      if (!(error instanceof ApiError)) {
        throw error;
      }
    }
  }

  const task = taskDetailQuery.data;
  const live = streamState;

  return (
    <div className="page-stack">
      <header className="page-hero ops-hero">
        <small>Ops Service</small>
        <h2>一页完成发布、重启与实时观察</h2>
        <p>管理端直接调用后端运维服务，卡片负责决策，执行弹窗负责可追溯过程，历史区负责复盘。</p>
      </header>

      <section className="ops-summary-bar">
        <div>
          <strong>{environmentsQuery.data?.length || 0}</strong>
          <span>已加载环境</span>
        </div>
        <div>
          <strong>{countRunningTasks(environmentsQuery.data)}</strong>
          <span>运行中任务</span>
        </div>
        <div>
          <strong>{countPendingCommits(environmentsQuery.data, "backend")}</strong>
          <span>后端待发布提交</span>
        </div>
        <div>
          <strong>{countPendingCommits(environmentsQuery.data, "frontend")}</strong>
          <span>前端待发布提交</span>
        </div>
      </section>

      {environmentsQuery.isError ? (
        <SectionCard title="环境查询失败" description="运维页已接入接口，但当前没有拿到环境数据。">
          <p className="ops-inline-error">{toErrorMessage(environmentsQuery.error)}</p>
        </SectionCard>
      ) : null}

      <div className="ops-grid">
        {(environmentsQuery.data || []).map((env) => {
          const backendExpanded = expandedCommitKey === `${env.key}:backend`;
          const frontendExpanded = expandedCommitKey === `${env.key}:frontend`;
          const running = Boolean(env.runningTask);

          return (
            <article className={`ops-card${running ? " running" : ""}${!env.enabled ? " disabled" : ""}`} key={env.key}>
              <div className={`ops-card-status ${env.status}${running ? " pulsating" : ""}`} />
              <div className="ops-card-header">
                <div>
                  <small>{env.key.toUpperCase()}</small>
                  <h3>{env.name}</h3>
                </div>
                <span className="ops-pill">{running ? "任务运行中" : envStatusText[env.status]}</span>
              </div>
              <a className="ops-domain" href={env.domain} rel="noreferrer" target="_blank">
                {env.domain || "未配置访问域名"}
              </a>
              <p className="ops-meta">
                最近一次:
                {env.lastDeploy
                  ? ` ${actionMeta[env.lastDeploy.type].label} · ${statusText[env.lastDeploy.status]} · ${formatDateTime(env.lastDeploy.finishedAt)}`
                  : " 从未发布"}
              </p>
              {env.runningTask ? (
                <button className="ops-running-banner" onClick={() => setViewerTaskId(env.runningTask!.id)} type="button">
                  正在执行: {actionMeta[env.runningTask.type].label} · 步骤 {env.runningTask.step}/{env.runningTask.totalSteps}{" "}
                  {env.runningTask.stepName || "处理中"}
                </button>
              ) : null}
              <div className="ops-commit-stack">
                <CommitPreview
                  expanded={backendExpanded}
                  label="后端"
                  onToggle={() => setExpandedCommitKey(backendExpanded ? null : `${env.key}:backend`)}
                  commits={env.pendingCommits.backend.recent}
                  count={env.pendingCommits.backend.count}
                />
                <CommitPreview
                  expanded={frontendExpanded}
                  label="前端"
                  onToggle={() => setExpandedCommitKey(frontendExpanded ? null : `${env.key}:frontend`)}
                  commits={env.pendingCommits.frontend.recent}
                  count={env.pendingCommits.frontend.count}
                />
              </div>
              <div className="ops-action-grid">
                {env.actions.map((type) => (
                  <button
                    className={`ops-action-button ${actionMeta[type].accent}`}
                    disabled={!env.enabled || running || createTaskMutation.isPending}
                    key={type}
                    onClick={() => {
                      if (env.confirmName) {
                        setConfirmState({ env, type });
                        setConfirmValue("");
                        return;
                      }
                      void handleCreateTask(env, type);
                    }}
                    type="button"
                  >
                    {actionMeta[type].label}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <SectionCard title="最近任务" description="列表接口不回日志，点查看后再拉详情与实时流。">
        <div className="ops-task-table">
          <div className="ops-task-head">
            <span>ID</span>
            <span>环境</span>
            <span>类型</span>
            <span>状态</span>
            <span>时间</span>
            <span>操作</span>
          </div>
          {(tasksQuery.data?.list || []).map((item) => (
            <div className="ops-task-row" key={item.id}>
              <span>#{item.id}</span>
              <span>{item.env}</span>
              <span>{actionMeta[item.type].label}</span>
              <span className={`ops-status-text ${item.status}`}>{statusText[item.status]}</span>
              <span>{formatDateTime(item.finishedAt || item.startedAt || item.createdAt)}</span>
              <button className="ops-text-button" onClick={() => setViewerTaskId(item.id)} type="button">
                查看日志
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {confirmState ? (
        <div className="ops-modal-backdrop">
          <div className="ops-modal confirm">
            <div className="ops-modal-top">
              <small>Production Gate</small>
              <h3>确认发布到 {confirmState.env.name}</h3>
              <p>必须先看完整提交列表，再输入环境标识完成确认。</p>
            </div>
            <div className="ops-commit-review">
              <CommitGroup
                commits={pickConfirmCommits(confirmState.env, confirmState.type, "backend")}
                title="后端提交"
              />
              <CommitGroup
                commits={pickConfirmCommits(confirmState.env, confirmState.type, "frontend")}
                title="前端提交"
              />
            </div>
            <label className="ops-confirm-input">
              <span>请输入 {confirmState.env.key} 确认</span>
              <input onChange={(event) => setConfirmValue(event.target.value)} value={confirmValue} />
            </label>
            {createTaskMutation.isError ? <p className="ops-inline-error">{toErrorMessage(createTaskMutation.error)}</p> : null}
            <div className="ops-modal-actions">
              <button
                className="ops-action-button soft"
                onClick={() => {
                  setConfirmState(null);
                  setConfirmValue("");
                }}
                type="button"
              >
                取消
              </button>
              <button
                className="ops-action-button primary"
                disabled={confirmValue !== confirmState.env.key || createTaskMutation.isPending}
                onClick={() => void handleCreateTask(confirmState.env, confirmState.type, confirmValue)}
                type="button"
              >
                确认发布
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {viewerTaskId !== null ? (
        <div className="ops-modal-backdrop">
          <div className="ops-modal task">
            <div className="ops-modal-top">
              <small>Execution Room</small>
              <div className="ops-task-title-row">
                <div>
                  <h3>
                    {task ? actionMeta[task.type].label : "任务详情"} · {task?.env || ""}
                  </h3>
                  <p>
                    {live?.done
                      ? `执行完成，耗时 ${live.done.duration || "未记录"}`
                      : live?.error
                        ? `${statusText[live.error.status]} · ${live.error.stepName || "执行失败"}`
                        : task?.summary || "正在同步任务状态"}
                  </p>
                </div>
                <button className="ops-close" onClick={() => setViewerTaskId(null)} type="button">
                  关闭
                </button>
              </div>
            </div>

            {taskDetailQuery.isLoading ? <p className="ops-loading">正在拉取任务详情...</p> : null}
            {task ? (
              <>
                <div className="ops-step-list">
                  {buildStepStates(task, live).map((item) => (
                    <div className={`ops-step-item ${item.state}`} key={`${item.index}-${item.label}`}>
                      <span>{item.badge}</span>
                      <strong>
                        {item.index}/{item.total} {item.label}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="ops-log-panel">
                  <div className="ops-log-head">
                    <strong>实时日志</strong>
                    <span>{live?.stepName || task.stepName || "等待任务推进"}</span>
                  </div>
                  <pre>{live?.log || task.log || "暂无日志"}</pre>
                </div>

                {live?.error ? (
                  <div className="ops-error-box">
                    <strong>{live.error.errMsg || "任务失败"}</strong>
                    <p>{live.error.suggestion || "请检查日志后重试"}</p>
                  </div>
                ) : null}

                {live?.status === "queued" || live?.status === "running" || task.status === "queued" || task.status === "running" ? (
                  <div className="ops-modal-actions">
                    <button
                      className="ops-action-button soft"
                      disabled={cancelTaskMutation.isPending}
                      onClick={() => void cancelTaskMutation.mutateAsync(task.id)}
                      type="button"
                    >
                      {cancelTaskMutation.isPending ? "取消中..." : "取消任务"}
                    </button>
                    {cancelTaskMutation.isError ? (
                      <p className="ops-inline-error">{toErrorMessage(cancelTaskMutation.error)}</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="ops-result-grid">
                  <SectionCard title="执行摘要" description="后端任务详情 + 前端流式状态合并展示。">
                    <dl className="detail-grid">
                      <dt>状态</dt>
                      <dd>{statusText[live?.status || task.status]}</dd>
                      <dt>当前步骤</dt>
                      <dd>
                        {live?.step || task.step}/{live?.totalSteps || task.totalSteps}
                      </dd>
                      <dt>开始时间</dt>
                      <dd>{formatDateTime(task.startedAt)}</dd>
                      <dt>结束时间</dt>
                      <dd>{formatDateTime(task.finishedAt)}</dd>
                    </dl>
                  </SectionCard>
                  <SectionCard title="本次提交" description="详情接口保存了本次任务真正纳入的提交集合。">
                    <CommitGroup commits={task.commits.backend} title="后端提交" />
                    <CommitGroup commits={task.commits.frontend} title="前端提交" />
                  </SectionCard>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CommitPreview({
  count,
  commits,
  expanded,
  label,
  onToggle,
}: {
  count: number;
  commits: CommitInfo[];
  expanded: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="ops-commit-block">
      <button className="ops-commit-toggle" disabled={count === 0} onClick={onToggle} type="button">
        <span>{label}</span>
        <strong>{count} 个待发布提交</strong>
      </button>
      {expanded ? (
        <div className="ops-commit-list">
          {commits.map((commit) => (
            <div className="ops-commit-row" key={`${commit.hash}-${commit.message}`}>
              <span>{commit.hash.slice(0, 7)}</span>
              <p>{commit.message}</p>
            </div>
          ))}
          {count > commits.length ? <small>共 {count} 条，仅展示最近 10 条。</small> : null}
        </div>
      ) : null}
    </div>
  );
}

function CommitGroup({ commits, title }: { commits: CommitInfo[]; title: string }) {
  return (
    <div className="ops-review-group">
      <strong>{title}</strong>
      {commits.length === 0 ? <p>本次没有待纳入的提交。</p> : null}
      {commits.map((commit) => (
        <div className="ops-review-row" key={`${title}-${commit.hash}-${commit.message}`}>
          <span>{commit.hash.slice(0, 7)}</span>
          <p>{commit.message}</p>
        </div>
      ))}
    </div>
  );
}

function buildStepStates(task: OpsTaskDetail, live: StreamSnapshot | null) {
  const labels = stepLabels[task.type];
  const currentStep = live?.step || task.step;
  const totalSteps = live?.totalSteps || task.totalSteps || labels.length;
  const currentStatus = live?.status || task.status;
  return labels.map((label, index) => {
    const step = index + 1;
    if (currentStatus === "success") {
      return { badge: "✓", index: step, label, total: totalSteps, state: "success" };
    }
    if ((currentStatus === "failed" || currentStatus === "cancelled") && step === currentStep) {
      return { badge: "!", index: step, label, total: totalSteps, state: "failed" };
    }
    if ((currentStatus === "failed" || currentStatus === "cancelled") && step > currentStep) {
      return { badge: "·", index: step, label, total: totalSteps, state: "skipped" };
    }
    if (step < currentStep) {
      return { badge: "✓", index: step, label, total: totalSteps, state: "success" };
    }
    if (step === currentStep && (currentStatus === "running" || currentStatus === "queued")) {
      return { badge: "↻", index: step, label, total: totalSteps, state: "running" };
    }
    return { badge: "·", index: step, label, total: totalSteps, state: "pending" };
  });
}

const stepLabels: Record<OpsTaskType, string[]> = {
  deploy_backend: ["拉取代码", "构建镜像", "重启服务", "健康检查"],
  deploy_frontend: ["拉取代码", "安装依赖", "构建项目", "发布文件", "重载 Nginx"],
  deploy_all: ["拉取代码", "构建镜像", "重启服务", "健康检查", "拉取代码", "安装依赖", "构建项目", "发布文件", "重载 Nginx"],
  restart_backend: ["重启服务", "健康检查"],
};

function countRunningTasks(list?: OpsEnvironmentItem[]) {
  return (list || []).filter((item) => item.runningTask).length;
}

function countPendingCommits(list: OpsEnvironmentItem[] | undefined, target: "backend" | "frontend") {
  return (list || []).reduce((sum, item) => sum + item.pendingCommits[target].count, 0);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "未记录";
  }
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
  });
}

function formatDuration(startedAt?: string, finishedAt?: string) {
  if (!startedAt || !finishedAt) {
    return "";
  }
  const delta = Math.max(new Date(finishedAt).getTime() - new Date(startedAt).getTime(), 0);
  const seconds = Math.round(delta / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m${seconds % 60}s`;
}

function findEnvByKey(list: OpsEnvironmentItem[] | undefined, key: string) {
  return (list || []).find((item) => item.key === key);
}

function pickConfirmCommits(env: OpsEnvironmentItem, type: OpsTaskType, target: "backend" | "frontend") {
  if (type === "restart_backend") {
    return [];
  }
  if (type === "deploy_backend" && target === "frontend") {
    return [];
  }
  if (type === "deploy_frontend" && target === "backend") {
    return [];
  }
  return env.pendingCommits[target].commits;
}

function toErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "请求失败";
}
