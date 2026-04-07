import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";
import type { SysRoleRecord, TreeOptionNode } from "@suiyuan/types";

type RoleDraft = {
  roleId?: number;
  roleName: string;
  roleKey: string;
  roleSort: number;
  status: string;
  flag: string;
  remark: string;
  admin: boolean;
  dataScope: string;
};

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

const statusLabels: Record<string, string> = {
  "1": "停用",
  "2": "正常",
};

const dataScopeLabels: Record<string, string> = {
  "1": "全部数据权限",
  "2": "自定数据权限",
  "3": "本部门数据权限",
  "4": "本部门及以下数据权限",
  "5": "仅本人数据权限",
};

const dataScopeOptions = [
  { value: "1", label: "全部数据权限" },
  { value: "2", label: "自定数据权限" },
  { value: "3", label: "本部门数据权限" },
  { value: "4", label: "本部门及以下数据权限" },
  { value: "5", label: "仅本人数据权限" },
];

function createRoleDraft(source?: Partial<SysRoleRecord>): RoleDraft {
  return {
    roleId: source?.roleId,
    roleName: source?.roleName || "",
    roleKey: source?.roleKey || "",
    roleSort: source?.roleSort ?? 0,
    status: source?.status || "2",
    flag: source?.flag || "",
    remark: source?.remark || "",
    admin: source?.admin ?? false,
    dataScope: source?.dataScope || "1",
  };
}

function collectNodeIds(nodes: TreeOptionNode[]): number[] {
  return nodes.flatMap((node) => [node.id, ...collectNodeIds(node.children || [])]);
}

function collectSingleNodeIds(node: TreeOptionNode): number[] {
  return [node.id, ...collectNodeIds(node.children || [])];
}

function toggleTreeNode(checkedIds: number[], node: TreeOptionNode, checked: boolean) {
  const next = new Set(checkedIds);
  for (const id of collectSingleNodeIds(node)) {
    if (checked) {
      next.add(id);
      continue;
    }
    next.delete(id);
  }
  return Array.from(next);
}

function TreeSelector({
  title,
  description,
  nodes,
  checkedIds,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  nodes: TreeOptionNode[];
  checkedIds: number[];
  disabled?: boolean;
  onChange: (next: number[]) => void;
}) {
  const checkedSet = useMemo(() => new Set(checkedIds), [checkedIds]);

  function renderNode(node: TreeOptionNode) {
    const descendantIds = collectSingleNodeIds(node);
    const checkedCount = descendantIds.filter((id) => checkedSet.has(id)).length;
    const isChecked = checkedCount === descendantIds.length && descendantIds.length > 0;
    const isIndeterminate = checkedCount > 0 && checkedCount < descendantIds.length;

    return (
      <li className="tree-node" key={`${title}-${node.id}`}>
        <label className={`tree-node-row${disabled ? " disabled" : ""}`}>
          <input
            checked={isChecked}
            disabled={disabled}
            onChange={(event) => onChange(toggleTreeNode(checkedIds, node, event.target.checked))}
            ref={(element) => {
              if (element) {
                element.indeterminate = isIndeterminate;
              }
            }}
            type="checkbox"
          />
          <span>{node.label}</span>
        </label>
        {node.children?.length ? <ul className="tree-node-children">{node.children.map((child) => renderNode(child))}</ul> : null}
      </li>
    );
  }

  return (
    <div className="tree-panel">
      <div className="tree-panel-head">
        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <div className="inline-actions">
          <button className="tiny-action" disabled={disabled} onClick={() => onChange(collectNodeIds(nodes))} type="button">
            全选
          </button>
          <button className="tiny-action" disabled={disabled} onClick={() => onChange([])} type="button">
            清空
          </button>
        </div>
      </div>
      <p className="tree-summary">当前选中 {checkedIds.length} 项</p>
      <div className="tree-scroll">
        {nodes.length ? <ul className="tree-root">{nodes.map((node) => renderNode(node))}</ul> : <p className="empty-tip">暂无可选项</p>}
      </div>
    </div>
  );
}

export function RolesPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [roleNameFilter, setRoleNameFilter] = useState("");
  const [roleKeyFilter, setRoleKeyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("新增角色");
  const [dialogLoading, setDialogLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [draft, setDraft] = useState<RoleDraft>(createRoleDraft());
  const [menuTree, setMenuTree] = useState<TreeOptionNode[]>([]);
  const [deptTree, setDeptTree] = useState<TreeOptionNode[]>([]);
  const [menuCheckedIds, setMenuCheckedIds] = useState<number[]>([]);
  const [deptCheckedIds, setDeptCheckedIds] = useState<number[]>([]);
  const [lockedMenuIds, setLockedMenuIds] = useState<number[]>([]);
  const [originalRoleKey, setOriginalRoleKey] = useState("");

  const rolesQuery = useQuery({
    queryKey: ["admin-page", "roles", roleNameFilter, roleKeyFilter, statusFilter, pageIndex],
    queryFn: () =>
      api.admin.listRoles({
        pageIndex,
        pageSize: 20,
        roleName: roleNameFilter || undefined,
        roleKey: roleKeyFilter || undefined,
        status: statusFilter || undefined,
      }),
  });
  const saveMutation = useMutation({
    mutationFn: async (payload: RoleDraft) => {
      const nextMenuIds = originalRoleKey === "admin" ? lockedMenuIds : menuCheckedIds;
      const nextDeptIds = payload.dataScope === "2" ? deptCheckedIds : [];
      const nextPayload = {
        roleId: payload.roleId,
        roleName: payload.roleName,
        roleKey: payload.roleKey,
        roleSort: payload.roleSort,
        status: payload.status,
        flag: payload.flag,
        remark: payload.remark,
        admin: payload.admin,
        dataScope: payload.dataScope,
        menuIds: nextMenuIds,
        deptIds: nextDeptIds,
      };
      if (payload.roleId) {
        await api.admin.updateRole(nextPayload as { roleId: number });
        await api.admin.updateRoleDataScope({
          roleId: payload.roleId,
          dataScope: payload.dataScope,
          deptIds: nextDeptIds,
        });
        return { mode: "update" as const };
      }
      const roleId = await api.admin.createRole(nextPayload);
      if (!roleId) {
        throw new Error("角色已创建，但接口未返回 roleId，无法继续保存数据权限");
      }
      await api.admin.updateRoleDataScope({
        roleId,
        dataScope: payload.dataScope,
        deptIds: nextDeptIds,
      });
      return { mode: "create" as const };
    },
    onSuccess: async (result) => {
      setFeedback({
        tone: "success",
        message: result.mode === "create" ? "角色已创建" : "角色已更新",
      });
      setDialogOpen(false);
      resetDialog();
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "roles"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "角色保存失败",
      });
    },
  });
  const statusMutation = useMutation({
    mutationFn: async (payload: { roleId: number; status: string }) => api.admin.updateRoleStatus(payload.roleId, payload.status),
    onSuccess: async () => {
      setFeedback({
        tone: "success",
        message: "角色状态已更新",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "roles"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "角色状态更新失败",
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (roleId: number) => api.admin.deleteRoles({ ids: [roleId] }),
    onSuccess: async () => {
      setFeedback({
        tone: "success",
        message: "角色已删除",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "roles"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "角色删除失败",
      });
    },
  });

  const rows = rolesQuery.data?.list || [];
  const total = rolesQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));
  const menuTreeLocked = originalRoleKey === "admin";

  function resetDialog() {
    setDraft(createRoleDraft());
    setMenuTree([]);
    setDeptTree([]);
    setMenuCheckedIds([]);
    setDeptCheckedIds([]);
    setLockedMenuIds([]);
    setOriginalRoleKey("");
  }

  async function loadPermissionTrees(roleId: number) {
    const [menuResponse, deptResponse] = await Promise.all([api.admin.getRoleMenuTree(roleId), api.admin.getRoleDeptTree(roleId)]);
    setMenuTree(menuResponse.menus || []);
    setDeptTree(deptResponse.depts || []);
    setMenuCheckedIds(menuResponse.checkedKeys || []);
    setDeptCheckedIds(deptResponse.checkedKeys || []);
    setLockedMenuIds(menuResponse.checkedKeys || []);
  }

  async function openCreateDialog() {
    setDialogOpen(true);
    setDialogTitle("新增角色");
    setDialogLoading(true);
    resetDialog();
    try {
      await loadPermissionTrees(0);
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "角色权限树加载失败",
      });
      setDialogOpen(false);
    } finally {
      setDialogLoading(false);
    }
  }

  async function openEditDialog(item: SysRoleRecord) {
    setDialogOpen(true);
    setDialogTitle(`编辑角色 · ${item.roleName}`);
    setDialogLoading(true);
    try {
      const [detail] = await Promise.all([api.admin.getRole(item.roleId), loadPermissionTrees(item.roleId)]);
      setDraft(createRoleDraft(detail));
      setOriginalRoleKey(detail.roleKey);
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "角色详情加载失败",
      });
      setDialogOpen(false);
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleDelete(item: SysRoleRecord) {
    if (!window.confirm(`确认删除角色「${item.roleName}」吗？`)) {
      return;
    }
    deleteMutation.mutate(item.roleId);
  }

  async function handleStatusToggle(item: SysRoleRecord) {
    const nextStatus = item.status === "2" ? "1" : "2";
    const actionText = nextStatus === "2" ? "启用" : "停用";
    if (!window.confirm(`确认${actionText}角色「${item.roleName}」吗？`)) {
      return;
    }
    statusMutation.mutate({
      roleId: item.roleId,
      status: nextStatus,
    });
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Admin Module</small>
        <h2>角色管理</h2>
        <p>角色页已恢复完整管理能力，包含角色基础信息、菜单权限、状态切换和数据权限配置。</p>
      </header>

      <div className="module-grid">
        <SectionCard title="筛选与操作" description="角色保存时会带完整菜单和部门权限，避免更新时清空关联表。">
          <div className="search-grid">
            <label className="search-field">
              <span>角色名称</span>
              <input
                onChange={(event) => {
                  setPageIndex(1);
                  setRoleNameFilter(event.target.value);
                }}
                placeholder="按角色名称过滤"
                value={roleNameFilter}
              />
            </label>
            <label className="search-field">
              <span>角色编码</span>
              <input
                onChange={(event) => {
                  setPageIndex(1);
                  setRoleKeyFilter(event.target.value);
                }}
                placeholder="按 roleKey 过滤"
                value={roleKeyFilter}
              />
            </label>
            <label className="search-field">
              <span>状态</span>
              <select
                onChange={(event) => {
                  setPageIndex(1);
                  setStatusFilter(event.target.value);
                }}
                value={statusFilter}
              >
                <option value="">全部</option>
                <option value="2">正常</option>
                <option value="1">停用</option>
              </select>
            </label>
          </div>
          <div className="inline-actions">
            <button className="primary-action" onClick={() => void openCreateDialog()} type="button">
              新增角色
            </button>
            <button
              className="soft-link"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-page", "roles"] })}
              type="button"
            >
              刷新数据
            </button>
          </div>
          {feedback ? <p className={`inline-feedback${feedback.tone === "error" ? " error" : ""}`}>{feedback.message}</p> : null}
        </SectionCard>

        <SectionCard title="当前说明" description="这页不再停留在只读查询，已经补到可维护的真实后台页。">
          <ul className="detail-list">
            <li>编辑时会同时拉取角色详情、菜单树和部门树，确保提交总是带完整权限数据。</li>
            <li>`admin` 角色保留菜单权限保护，编辑时仅展示已绑定菜单，不允许误清空。</li>
            <li>数据权限沿用后端既有语义，自定义部门时才展示部门树选择器。</li>
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="角色列表" description={`当前共 ${total} 条角色记录。`}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>角色名称</th>
                <th>角色编码</th>
                <th>排序</th>
                <th>数据权限</th>
                <th>状态</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.roleId}>
                  <td>
                    <strong>{row.roleName}</strong>
                    <div className="cell-subline">{row.admin ? "系统管理员角色" : `角色ID: ${row.roleId}`}</div>
                  </td>
                  <td>{row.roleKey}</td>
                  <td>{row.roleSort}</td>
                  <td>{dataScopeLabels[row.dataScope] || row.dataScope || "-"}</td>
                  <td>{statusLabels[row.status] || row.status}</td>
                  <td>{row.remark || "-"}</td>
                  <td>
                    <div className="row-actions">
                      <button className="tiny-action" onClick={() => void openEditDialog(row)} type="button">
                        编辑
                      </button>
                      <button className="tiny-action" onClick={() => void handleStatusToggle(row)} type="button">
                        {row.status === "2" ? "停用" : "启用"}
                      </button>
                      {row.roleKey !== "admin" ? (
                        <button className="tiny-action danger" onClick={() => void handleDelete(row)} type="button">
                          删除
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination-row">
          <button className="soft-link" disabled={pageIndex <= 1} onClick={() => setPageIndex((current) => current - 1)} type="button">
            上一页
          </button>
          <span>
            第 {pageIndex} / {totalPages} 页
          </span>
          <button
            className="soft-link"
            disabled={pageIndex >= totalPages}
            onClick={() => setPageIndex((current) => current + 1)}
            type="button"
          >
            下一页
          </button>
        </div>
      </SectionCard>

      {dialogOpen ? (
        <div className="modal-mask">
          <div className="modal-card role-modal">
            <div className="detail-modal-head">
              <div>
                <h3>{dialogTitle}</h3>
                <p className="dialog-description">角色保存分为角色主信息和数据权限两段，页面会自动按正确顺序提交。</p>
              </div>
              <button
                className="soft-link"
                onClick={() => {
                  setDialogOpen(false);
                  resetDialog();
                }}
                type="button"
              >
                关闭
              </button>
            </div>
            {dialogLoading ? <p className="empty-tip">正在加载角色权限树...</p> : null}
            {!dialogLoading ? (
              <>
                <div className="form-grid two-columns">
                  <label className="form-field">
                    <span>角色名称</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          roleName: event.target.value,
                        }))
                      }
                      value={draft.roleName}
                    />
                  </label>
                  <label className="form-field">
                    <span>角色编码</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          roleKey: event.target.value,
                        }))
                      }
                      value={draft.roleKey}
                    />
                  </label>
                  <label className="form-field">
                    <span>角色排序</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          roleSort: Number(event.target.value),
                        }))
                      }
                      type="number"
                      value={String(draft.roleSort)}
                    />
                  </label>
                  <label className="form-field">
                    <span>状态</span>
                    <select
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                      value={draft.status}
                    >
                      <option value="2">正常</option>
                      <option value="1">停用</option>
                    </select>
                  </label>
                  <label className="form-field">
                    <span>数据权限</span>
                    <select
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          dataScope: event.target.value,
                        }))
                      }
                      value={draft.dataScope}
                    >
                      {dataScopeOptions.map((item) => (
                        <option key={`data-scope-${item.value}`} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>标记</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          flag: event.target.value,
                        }))
                      }
                      value={draft.flag}
                    />
                  </label>
                  <label className="form-field role-remark-field">
                    <span>备注</span>
                    <textarea
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          remark: event.target.value,
                        }))
                      }
                      rows={4}
                      value={draft.remark}
                    />
                  </label>
                </div>

                <div className="two-column-grid role-tree-grid">
                  <TreeSelector
                    checkedIds={menuCheckedIds}
                    description={menuTreeLocked ? "admin 角色的菜单权限保持锁定，只展示已绑定结果。" : "勾选菜单即提交完整菜单权限集合。"}
                    disabled={menuTreeLocked}
                    nodes={menuTree}
                    onChange={setMenuCheckedIds}
                    title="菜单权限"
                  />
                  <TreeSelector
                    checkedIds={deptCheckedIds}
                    description={draft.dataScope === "2" ? "仅在“自定数据权限”时生效。" : "当前数据权限不需要单独选择部门。"}
                    disabled={draft.dataScope !== "2"}
                    nodes={deptTree}
                    onChange={setDeptCheckedIds}
                    title="部门权限"
                  />
                </div>

                <div className="inline-actions">
                  <button
                    className="primary-action"
                    disabled={saveMutation.isPending || !draft.roleName.trim() || !draft.roleKey.trim()}
                    onClick={() => saveMutation.mutate(draft)}
                    type="button"
                  >
                    {saveMutation.isPending ? "保存中..." : "保存角色"}
                  </button>
                  <button
                    className="soft-link"
                    onClick={() => {
                      setDialogOpen(false);
                      resetDialog();
                    }}
                    type="button"
                  >
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
