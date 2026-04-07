import { type ReactNode, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SectionCard } from "@suiyuan/ui-admin";
import type { PagePayload, QueryPayload } from "@suiyuan/types";

type Column<T> = {
  label: string;
  render: (row: T) => ReactNode;
};

type SearchField = {
  key: string;
  label: string;
  placeholder: string;
};

type FormField = {
  key: string;
  label: string;
  type?: "text" | "password" | "number" | "textarea" | "select";
  placeholder?: string;
  options?: Array<{
    label: string;
    value: string | number;
  }>;
};

type CrudDataPageProps<T extends object> = {
  title: string;
  description: string;
  queryKey: string;
  columns: Array<Column<T>>;
  searchFields?: SearchField[];
  formFields?: FormField[];
  fetcher: (params: QueryPayload) => Promise<PagePayload<T>>;
  createItem?: (payload: Record<string, unknown>) => Promise<unknown>;
  updateItem?: (payload: Record<string, unknown>) => Promise<unknown>;
  deleteItem?: (payload: Record<string, unknown>) => Promise<unknown>;
  createDraft?: () => Record<string, unknown>;
  toDraft?: (item: T) => Record<string, unknown>;
  getRowId: (item: T) => number | string;
  renderAside?: () => ReactNode;
  rowActions?: (item: T) => ReactNode;
};

function defaultDraftFactory() {
  return {};
}

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

export function CrudDataPage<T extends object>({
  title,
  description,
  queryKey,
  columns,
  searchFields = [],
  formFields = [],
  fetcher,
  createItem,
  updateItem,
  deleteItem,
  createDraft = defaultDraftFactory,
  toDraft,
  getRowId,
  renderAside,
  rowActions,
}: CrudDataPageProps<T>) {
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, unknown>>(createDraft());
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const params = useMemo<QueryPayload>(() => ({ ...filters, pageIndex, pageSize: 20 }), [filters, pageIndex]);

  const listQuery = useQuery({
    queryKey: ["admin-page", queryKey, params],
    queryFn: () => fetcher(params),
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (editingId !== null && updateItem) {
        return updateItem(payload);
      }
      if (createItem) {
        return createItem(payload);
      }
      return null;
    },
    onSuccess: async (_result, payload) => {
      setFeedback({
        tone: "success",
        message: payload.id || editingId !== null ? "记录已更新" : "记录已创建",
      });
      setDialogOpen(false);
      setEditingId(null);
      setDraft(createDraft());
      await queryClient.invalidateQueries({ queryKey: ["admin-page", queryKey] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "记录保存失败",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      if (!deleteItem) {
        return null;
      }
      return deleteItem(payload);
    },
    onSuccess: async () => {
      setFeedback({
        tone: "success",
        message: "记录已删除",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-page", queryKey] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "记录删除失败",
      });
    },
  });

  const list = listQuery.data?.list || [];
  const total = listQuery.data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  function openCreateDialog() {
    setEditingId(null);
    setDraft(createDraft());
    setDialogOpen(true);
  }

  function openEditDialog(item: T) {
    setEditingId(getRowId(item));
    setDraft(toDraft ? toDraft(item) : { ...(item as Record<string, unknown>) });
    setDialogOpen(true);
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Admin Module</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <div className="module-grid">
        <SectionCard title="查询与操作" description="先完成真实接口接入，后续再逐模块升级视觉与交互。">
          <div className="search-grid">
            {searchFields.map((field) => (
              <label className="search-field" key={field.key}>
                <span>{field.label}</span>
                <input
                  onChange={(event) => {
                    setPageIndex(1);
                    setFilters((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }));
                  }}
                  placeholder={field.placeholder}
                  value={filters[field.key] || ""}
                />
              </label>
            ))}
          </div>
          <div className="inline-actions">
            {createItem ? (
              <button className="primary-action" onClick={openCreateDialog} type="button">
                新建记录
              </button>
            ) : null}
            <button
              className="soft-link"
              onClick={() => void queryClient.invalidateQueries({ queryKey: ["admin-page", queryKey] })}
              type="button"
            >
              刷新数据
            </button>
          </div>
          {feedback ? <p className={`inline-feedback${feedback.tone === "error" ? " error" : ""}`}>{feedback.message}</p> : null}
        </SectionCard>

        {renderAside ? renderAside() : null}
      </div>

      <SectionCard
        title="数据列表"
        description={`当前共 ${total} 条记录。第一阶段以功能对齐为主，保留清晰、可直接迁移的结构。`}
      >
        {listQuery.isLoading ? <p className="empty-tip">正在加载数据...</p> : null}
        {listQuery.isError ? <p className="empty-tip">数据查询失败，请检查登录态和接口配置。</p> : null}
        {!listQuery.isLoading && !listQuery.isError ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.label}>{column.label}</th>
                  ))}
                  {(rowActions || createItem || updateItem || deleteItem) ? <th>操作</th> : null}
                </tr>
              </thead>
              <tbody>
                {list.map((item) => (
                  <tr key={String(getRowId(item))}>
                    {columns.map((column) => (
                      <td key={column.label}>{column.render(item)}</td>
                    ))}
                    {(rowActions || createItem || updateItem || deleteItem) ? (
                      <td>
                        <div className="row-actions">
                          {updateItem ? (
                            <button className="tiny-action" onClick={() => openEditDialog(item)} type="button">
                              编辑
                            </button>
                          ) : null}
                          {deleteItem ? (
                            <button
                              className="tiny-action danger"
                              onClick={() => {
                                if (!window.confirm("确认删除这条记录吗？")) {
                                  return;
                                }
                                deleteMutation.mutate({ ids: [getRowId(item)] });
                              }}
                              type="button"
                            >
                              删除
                            </button>
                          ) : null}
                          {rowActions ? rowActions(item) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
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

      {dialogOpen && formFields.length > 0 ? (
        <div className="modal-mask">
          <div className="modal-card">
            <h3>{editingId !== null ? "编辑记录" : "新建记录"}</h3>
            <div className="form-grid">
              {formFields.map((field) => (
                <label className="form-field" key={field.key}>
                  <span>{field.label}</span>
                  {field.type === "textarea" ? (
                    <textarea
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      rows={4}
                      value={String(draft[field.key] ?? "")}
                    />
                  ) : field.type === "select" ? (
                    <select
                      onChange={(event) => {
                        const selectedOption = (field.options || []).find(
                          (option) => String(option.value) === event.target.value,
                        );
                        setDraft((current) => ({
                          ...current,
                          [field.key]: selectedOption ? selectedOption.value : event.target.value,
                        }));
                      }}
                      value={String(draft[field.key] ?? "")}
                    >
                      <option value="">请选择</option>
                      {(field.options || []).map((option) => (
                        <option key={`${field.key}-${option.value}`} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [field.key]: field.type === "number" ? Number(event.target.value) : event.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      type={field.type || "text"}
                      value={String(draft[field.key] ?? "")}
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="inline-actions">
              <button
                className="primary-action"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate(draft)}
                type="button"
              >
                {saveMutation.isPending ? "保存中..." : "保存"}
              </button>
              <button
                className="soft-link"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingId(null);
                  setDraft(createDraft());
                }}
                type="button"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
