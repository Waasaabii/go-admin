import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";
import type { SysApiRecord, SysMenuRecord } from "@suiyuan/types";

type FlatMenuRecord = SysMenuRecord & { level: number };

type MenuDraft = {
  menuId?: number;
  parentId: number;
  menuName: string;
  title: string;
  icon: string;
  path: string;
  menuType: string;
  action: string;
  permission: string;
  component: string;
  sort: number;
  visible: string;
  isFrame: string;
  noCache: boolean;
  breadcrumb: string;
  apis: number[];
};

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

const menuTypeLabels: Record<string, string> = {
  M: "目录",
  C: "菜单",
  F: "按钮",
};

function createMenuDraft(parentId = 0, source?: Partial<SysMenuRecord>): MenuDraft {
  return {
    menuId: source?.menuId,
    parentId: source?.parentId ?? parentId,
    menuName: source?.menuName || "",
    title: source?.title || "",
    icon: source?.icon || "",
    path: source?.path || "",
    menuType: source?.menuType || "M",
    action: source?.action || "GET",
    permission: source?.permission || "",
    component: source?.component || "",
    sort: source?.sort ?? 0,
    visible: source?.visible || "0",
    isFrame: source?.isFrame || "1",
    noCache: source?.noCache ?? false,
    breadcrumb: source?.breadcrumb || "",
    apis: source?.apis || source?.sysApi?.map((item) => item.id) || [],
  };
}

export function MenusPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [titleFilter, setTitleFilter] = useState("");
  const [visibleFilter, setVisibleFilter] = useState("");
  const [dialogTitle, setDialogTitle] = useState("新增菜单");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [draft, setDraft] = useState<MenuDraft>(createMenuDraft());
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const menusQuery = useQuery({
    queryKey: ["admin-page", "menus-tree", titleFilter, visibleFilter],
    queryFn: () =>
      api.admin.listMenus({
        title: titleFilter || undefined,
        visible: visibleFilter || undefined,
      }),
  });
  const apiOptionsQuery = useQuery({
    queryKey: ["admin-page", "menu-api-options"],
    queryFn: () => api.admin.listApis({ pageIndex: 1, pageSize: 500, type: "BUS" }),
  });
  const saveMutation = useMutation({
    mutationFn: async (payload: MenuDraft) => {
      const nextPayload = {
        menuId: payload.menuId,
        parentId: payload.parentId,
        menuName: payload.menuName,
        title: payload.title,
        icon: payload.icon,
        path: payload.path,
        menuType: payload.menuType,
        action: payload.action,
        permission: payload.permission,
        component: payload.component,
        sort: payload.sort,
        visible: payload.visible,
        isFrame: payload.isFrame,
        noCache: payload.noCache,
        breadcrumb: payload.breadcrumb,
        apis: payload.apis,
      };
      if (payload.menuId) {
        return api.admin.updateMenu(nextPayload as { menuId: number; apis?: number[] });
      }
      return api.admin.createMenu(nextPayload);
    },
    onSuccess: async (_result, payload) => {
      setFeedback({
        tone: "success",
        message: payload.menuId ? "菜单已更新" : "菜单已创建",
      });
      setDialogOpen(false);
      setDraft(createMenuDraft());
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "menus-tree"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "菜单保存失败",
      });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (menuId: number) => api.admin.deleteMenus({ ids: [menuId] }),
    onSuccess: async () => {
      setFeedback({
        tone: "success",
        message: "菜单已删除",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "menus-tree"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "菜单删除失败",
      });
    },
  });

  const rows = useMemo(() => flattenMenus(menusQuery.data || []), [menusQuery.data]);
  const parentOptions = useMemo(() => {
    const root: FlatMenuRecord = {
      menuId: 0,
      menuName: "root",
      title: "主类目",
      icon: "",
      path: "",
      paths: "/0",
      menuType: "M",
      action: "",
      permission: "",
      parentId: 0,
      noCache: false,
      breadcrumb: "",
      component: "Layout",
      sort: 0,
      visible: "0",
      isFrame: "1",
      level: 0,
    };
    return [root, ...rows].filter((item) => {
      if (!draft.menuId || item.menuId === 0) {
        return true;
      }
      return item.menuId !== draft.menuId && !item.paths.includes(`/${draft.menuId}/`);
    });
  }, [draft.menuId, rows]);

  async function openCreateDialog(parent?: FlatMenuRecord) {
    setDialogTitle(parent ? `新增子菜单 · ${parent.title}` : "新增菜单");
    setDraft(createMenuDraft(parent?.menuId || 0));
    setDialogOpen(true);
  }

  async function openEditDialog(item: FlatMenuRecord) {
    setDialogLoading(true);
    try {
      const detail = await api.admin.getMenu(item.menuId);
      setDialogTitle(`编辑菜单 · ${detail.title}`);
      setDraft(createMenuDraft(detail.parentId, detail));
      setDialogOpen(true);
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleDelete(item: FlatMenuRecord) {
    if (!window.confirm(`确认删除菜单「${item.title}」吗？`)) {
      return;
    }
    deleteMutation.mutate(item.menuId);
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Admin Module</small>
        <h2>菜单管理</h2>
        <p>菜单管理已经切到第二阶段，支持树结构查询、增改删，以及 API 关联保真提交。</p>
      </header>

      <div className="module-grid">
        <SectionCard title="筛选与操作" description="菜单更新时会保留现有关联 API，避免误清空权限绑定。">
          <div className="search-grid">
            <label className="search-field">
              <span>菜单名称</span>
              <input onChange={(event) => setTitleFilter(event.target.value)} placeholder="按标题过滤" value={titleFilter} />
            </label>
            <label className="search-field">
              <span>显示状态</span>
              <select onChange={(event) => setVisibleFilter(event.target.value)} value={visibleFilter}>
                <option value="">全部</option>
                <option value="0">显示</option>
                <option value="1">隐藏</option>
              </select>
            </label>
          </div>
          <div className="inline-actions">
            <button className="primary-action" onClick={() => void openCreateDialog()} type="button">
              新增菜单
            </button>
            <button
              className="soft-link"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-page", "menus-tree"] })}
              type="button"
            >
              刷新数据
            </button>
          </div>
          {feedback ? <p className={`inline-feedback${feedback.tone === "error" ? " error" : ""}`}>{feedback.message}</p> : null}
        </SectionCard>

        <SectionCard title="当前说明" description="优先把树结构管理做到稳定可用，不在本轮做图标库和路由设计器。">
          <ul className="detail-list">
            <li>目录、菜单、按钮三类节点共用一套编辑器，字段按后端 DTO 原样提交。</li>
            <li>编辑菜单时会先拉取详情，再回填现有关联 API，避免清空 `sys_menu_api_rule`。</li>
            <li>开发工具页的 React 化不在本轮范围，菜单仍可指向桥接页路径。</li>
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="菜单树" description={`当前共 ${rows.length} 个节点，树结构按后端返回顺序展开。`}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>菜单名称</th>
                <th>路径 / 组件</th>
                <th>类型</th>
                <th>权限标识</th>
                <th>可见</th>
                <th>关联 API</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.menuId}>
                  <td>
                    <strong>{`${"　".repeat(row.level)}${row.title}`}</strong>
                    <div className="cell-subline">{row.menuName || "-"}</div>
                  </td>
                  <td>
                    <div>{row.path || "-"}</div>
                    <div className="cell-subline">{row.component || "-"}</div>
                  </td>
                  <td>{menuTypeLabels[row.menuType] || row.menuType}</td>
                  <td>{row.permission || "-"}</td>
                  <td>{row.visible === "0" ? "显示" : "隐藏"}</td>
                  <td>{row.sysApi?.length || 0}</td>
                  <td>
                    <div className="row-actions">
                      <button className="tiny-action" onClick={() => void openEditDialog(row)} type="button">
                        编辑
                      </button>
                      {row.menuType !== "F" ? (
                        <button className="tiny-action" onClick={() => void openCreateDialog(row)} type="button">
                          新增子级
                        </button>
                      ) : null}
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
          <div className="modal-card detail-modal">
            <div className="detail-modal-head">
              <div>
                <h3>{dialogTitle}</h3>
                <p className="dialog-description">当前编辑器直接对应后端菜单 DTO，提交后会刷新整个菜单树。</p>
              </div>
              <button className="soft-link" onClick={() => setDialogOpen(false)} type="button">
                关闭
              </button>
            </div>
            {dialogLoading ? <p className="empty-tip">正在加载菜单详情...</p> : null}
            {!dialogLoading ? (
              <>
                <div className="form-grid two-columns">
                  <label className="form-field">
                    <span>上级菜单</span>
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
                        <option key={`parent-${item.menuId}`} value={item.menuId}>
                          {`${"　".repeat(item.level)}${item.title}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span>菜单类型</span>
                    <select
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          menuType: event.target.value,
                        }))
                      }
                      value={draft.menuType}
                    >
                      <option value="M">目录</option>
                      <option value="C">菜单</option>
                      <option value="F">按钮</option>
                    </select>
                  </label>
                  <label className="form-field">
                    <span>菜单标题</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      value={draft.title}
                    />
                  </label>
                  <label className="form-field">
                    <span>路由名称</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          menuName: event.target.value,
                        }))
                      }
                      value={draft.menuName}
                    />
                  </label>
                  <label className="form-field">
                    <span>菜单图标</span>
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          icon: event.target.value,
                        }))
                      }
                      value={draft.icon}
                    />
                  </label>
                  <label className="form-field">
                    <span>显示排序</span>
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
                  {draft.menuType !== "F" ? (
                    <label className="form-field">
                      <span>路由地址</span>
                      <input
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            path: event.target.value,
                          }))
                        }
                        value={draft.path}
                      />
                    </label>
                  ) : null}
                  {draft.menuType !== "F" ? (
                    <label className="form-field">
                      <span>组件路径</span>
                      <input
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            component: event.target.value,
                          }))
                        }
                        value={draft.component}
                      />
                    </label>
                  ) : null}
                  {(draft.menuType === "C" || draft.menuType === "F") ? (
                    <label className="form-field">
                      <span>权限标识</span>
                      <input
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            permission: event.target.value,
                          }))
                        }
                        value={draft.permission}
                      />
                    </label>
                  ) : null}
                  {(draft.menuType === "C" || draft.menuType === "F") ? (
                    <label className="form-field">
                      <span>请求方式</span>
                      <select
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            action: event.target.value,
                          }))
                        }
                        value={draft.action}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </label>
                  ) : null}
                  {draft.menuType !== "F" ? (
                    <label className="form-field">
                      <span>显示状态</span>
                      <select
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            visible: event.target.value,
                          }))
                        }
                        value={draft.visible}
                      >
                        <option value="0">显示</option>
                        <option value="1">隐藏</option>
                      </select>
                    </label>
                  ) : null}
                  {draft.menuType !== "F" ? (
                    <label className="form-field">
                      <span>是否外链</span>
                      <select
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            isFrame: event.target.value,
                          }))
                        }
                        value={draft.isFrame}
                      >
                        <option value="1">否</option>
                        <option value="0">是</option>
                      </select>
                    </label>
                  ) : null}
                </div>

                {(draft.menuType === "C" || draft.menuType === "F") ? (
                  <div className="field-stack">
                    <h4>关联 API</h4>
                    <div className="checkbox-grid">
                      {(apiOptionsQuery.data?.list || []).map((item: SysApiRecord) => {
                        const checked = draft.apis.includes(item.id);
                        return (
                          <label className={`check-option${checked ? " active" : ""}`} key={`api-${item.id}`}>
                            <input
                              checked={checked}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  apis: event.target.checked
                                    ? [...current.apis, item.id]
                                    : current.apis.filter((apiId) => apiId !== item.id),
                                }))
                              }
                              type="checkbox"
                            />
                            <div>
                              <strong>{item.title || "未命名接口"}</strong>
                              <span>{`${item.action} ${item.path}`}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="inline-actions">
                  <button
                    className="primary-action"
                    disabled={saveMutation.isPending || !draft.title.trim()}
                    onClick={() => saveMutation.mutate(draft)}
                    type="button"
                  >
                    {saveMutation.isPending ? "保存中..." : "保存菜单"}
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

function flattenMenus(items: SysMenuRecord[], level = 0): FlatMenuRecord[] {
  return items.flatMap((item) => [{ ...item, level }, ...flattenMenus(item.children || [], level + 1)]);
}
