import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";
import type { SysDeptRecord } from "@suiyuan/types";

type FlatDeptRecord = SysDeptRecord & { level: number };

type DeptDraft = {
  deptId?: number;
  parentId: number;
  deptName: string;
  sort: number;
  leader: string;
  phone: string;
  email: string;
  status: number;
};

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

function createDeptDraft(parentId = 0, source?: Partial<SysDeptRecord>): DeptDraft {
  return {
    deptId: source?.deptId,
    parentId: source?.parentId ?? parentId,
    deptName: source?.deptName || "",
    sort: source?.sort ?? 0,
    leader: source?.leader || "",
    phone: source?.phone || "",
    email: source?.email || "",
    status: source?.status ?? 2,
  };
}

export function DeptsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [deptNameFilter, setDeptNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("新增部门");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [draft, setDraft] = useState<DeptDraft>(createDeptDraft());
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const deptQuery = useQuery({
    queryKey: ["admin-page", "depts-tree", deptNameFilter, statusFilter],
    queryFn: () =>
      api.admin.listDepts({
        deptName: deptNameFilter || undefined,
        status: statusFilter || undefined,
      }),
  });
  const saveMutation = useMutation({
    mutationFn: async (payload: DeptDraft) => {
      const nextPayload = {
        deptId: payload.deptId,
        parentId: payload.parentId,
        deptName: payload.deptName,
        sort: payload.sort,
        leader: payload.leader,
        phone: payload.phone,
        email: payload.email,
        status: payload.status,
      };
      if (payload.deptId) {
        return api.admin.updateDept(nextPayload as { deptId: number });
      }
      return api.admin.createDept(nextPayload);
    },
    onSuccess: async (_result, payload) => {
      setFeedback({
        tone: "success",
        message: payload.deptId ? "部门已更新" : "部门已创建",
      });
      setDialogOpen(false);
      setDraft(createDeptDraft());
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "depts-tree"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "部门保存失败",
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (deptId: number) => api.admin.deleteDepts({ ids: [deptId] }),
    onSuccess: async () => {
      setFeedback({
        tone: "success",
        message: "部门已删除",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "depts-tree"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "部门删除失败",
      });
    },
  });

  const rows = useMemo(() => flattenDeptTree(deptQuery.data || []), [deptQuery.data]);
  const parentOptions = useMemo(() => {
    const root: FlatDeptRecord = {
      deptId: 0,
      parentId: 0,
      deptPath: "/0/",
      deptName: "顶级部门",
      sort: 0,
      leader: "",
      phone: "",
      email: "",
      status: 2,
      level: 0,
    };
    return [root, ...rows].filter((item) => {
      if (!draft.deptId || item.deptId === 0) {
        return true;
      }
      return item.deptId !== draft.deptId && !item.deptPath.includes(`/${draft.deptId}/`);
    });
  }, [draft.deptId, rows]);

  function openCreateDialog(parent?: FlatDeptRecord) {
    setDialogTitle(parent ? `新增子部门 · ${parent.deptName}` : "新增部门");
    setDraft(createDeptDraft(parent?.deptId || 0));
    setDialogOpen(true);
  }

  async function openEditDialog(item: FlatDeptRecord) {
    setDialogLoading(true);
    try {
      const detail = await api.admin.getDept(item.deptId);
      setDialogTitle(`编辑部门 · ${detail.deptName}`);
      setDraft(createDeptDraft(detail.parentId, detail));
      setDialogOpen(true);
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleDelete(item: FlatDeptRecord) {
    if (!window.confirm(`确认删除部门「${item.deptName}」吗？`)) {
      return;
    }
    deleteMutation.mutate(item.deptId);
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Admin Module</small>
        <h2>部门管理</h2>
        <p>部门树已经升级为可维护页面，支持组织结构的新增、编辑和删除。</p>
      </header>

      <div className="module-grid">
        <SectionCard title="筛选与操作" description="当前保留树表形态，优先保证与用户、角色、岗位的组织关联稳定。">
          <div className="search-grid">
            <label className="search-field">
              <span>部门名称</span>
              <input onChange={(event) => setDeptNameFilter(event.target.value)} placeholder="按部门名称过滤" value={deptNameFilter} />
            </label>
            <label className="search-field">
              <span>状态</span>
              <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
                <option value="">全部</option>
                <option value="2">正常</option>
                <option value="1">停用</option>
              </select>
            </label>
          </div>
          <div className="inline-actions">
            <button className="primary-action" onClick={() => openCreateDialog()} type="button">
              新增部门
            </button>
            <button
              className="soft-link"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-page", "depts-tree"] })}
              type="button"
            >
              刷新数据
            </button>
          </div>
          {feedback ? <p className={`inline-feedback${feedback.tone === "error" ? " error" : ""}`}>{feedback.message}</p> : null}
        </SectionCard>
        <SectionCard title="当前说明" description="部门路径由后端自动维护，前端只提交基础业务字段。">
          <ul className="detail-list">
            <li>新增和编辑都会重新刷新整棵部门树，避免本地拼装脏数据。</li>
            <li>父部门选择时会排除当前节点和其后代，避免形成循环树。</li>
            <li>这一页继续沿用原后端字段，不额外引入自定义部门属性。</li>
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="部门树" description={`当前共 ${rows.length} 个部门节点。`}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>部门名称</th>
                <th>负责人</th>
                <th>手机号</th>
                <th>邮箱</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.deptId}>
                  <td>{`${"　".repeat(row.level)}${row.deptName}`}</td>
                  <td>{row.leader || "-"}</td>
                  <td>{row.phone || "-"}</td>
                  <td>{row.email || "-"}</td>
                  <td>{row.status === 2 ? "正常" : "停用"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="tiny-action" onClick={() => void openEditDialog(row)} type="button">
                        编辑
                      </button>
                      <button className="tiny-action" onClick={() => openCreateDialog(row)} type="button">
                        新增子级
                      </button>
                      <button className="tiny-action danger" onClick={() => void handleDelete(row)} type="button">
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {dialogOpen ? (
        <div className="modal-mask">
          <div className="modal-card">
            <div className="detail-modal-head">
              <div>
                <h3>{dialogTitle}</h3>
                <p className="dialog-description">部门树结构由后端维护路径，当前表单只关注业务字段。</p>
              </div>
              <button className="soft-link" onClick={() => setDialogOpen(false)} type="button">
                关闭
              </button>
            </div>
            {dialogLoading ? <p className="empty-tip">正在加载部门详情...</p> : null}
            {!dialogLoading ? (
              <>
                <div className="form-grid two-columns">
                  <label className="form-field">
                    <span>上级部门</span>
                    <select
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          parentId: Number(event.target.value),
                        }))
                      }
                      value={String(draft.parentId)}
                    >
                      {parentOptions.map((item) => (
                        <option key={`dept-parent-${item.deptId}`} value={item.deptId}>
                          {`${"　".repeat(item.level)}${item.deptName}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>部门名称</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          deptName: event.target.value,
                        }))
                      }
                      value={draft.deptName}
                    />
                  </label>
                  <label className="form-field">
                    <span>负责人</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          leader: event.target.value,
                        }))
                      }
                      value={draft.leader}
                    />
                  </label>
                  <label className="form-field">
                    <span>排序</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          sort: Number(event.target.value),
                        }))
                      }
                      type="number"
                      value={String(draft.sort)}
                    />
                  </label>
                  <label className="form-field">
                    <span>手机号</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      value={draft.phone}
                    />
                  </label>
                  <label className="form-field">
                    <span>邮箱</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      value={draft.email}
                    />
                  </label>
                  <label className="form-field">
                    <span>状态</span>
                    <select
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          status: Number(event.target.value),
                        }))
                      }
                      value={String(draft.status)}
                    >
                      <option value="2">正常</option>
                      <option value="1">停用</option>
                    </select>
                  </label>
                </div>
                <div className="inline-actions">
                  <button
                    className="primary-action"
                    disabled={saveMutation.isPending || !draft.deptName.trim() || !draft.leader.trim()}
                    onClick={() => saveMutation.mutate(draft)}
                    type="button"
                  >
                    {saveMutation.isPending ? "保存中..." : "保存部门"}
                  </button>
                  <button className="soft-link" onClick={() => setDialogOpen(false)} type="button">
                    取消
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function flattenDeptTree(items: SysDeptRecord[], level = 0): FlatDeptRecord[] {
  return items.flatMap((item) => [{ ...item, level }, ...flattenDeptTree(item.children || [], level + 1)]);
}
