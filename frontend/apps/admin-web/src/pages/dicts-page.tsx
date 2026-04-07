import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";
import type { SysDictDataRecord, SysDictTypeRecord } from "@suiyuan/types";

type DictTypeDraft = {
  id?: number;
  dictName: string;
  dictType: string;
  status: number;
  remark: string;
};

type DictDataDraft = {
  dictCode?: number;
  dictSort: number;
  dictLabel: string;
  dictValue: string;
  dictType: string;
  cssClass: string;
  listClass: string;
  isDefault: string;
  status: number;
  remark: string;
};

type FeedbackState =
  | {
      tone: "success" | "error";
      message: string;
    }
  | null;

function createTypeDraft(source?: Partial<SysDictTypeRecord>): DictTypeDraft {
  return {
    id: source?.id,
    dictName: source?.dictName || "",
    dictType: source?.dictType || "",
    status: source?.status ?? 2,
    remark: source?.remark || "",
  };
}

function createDataDraft(dictType = "", source?: Partial<SysDictDataRecord>): DictDataDraft {
  return {
    dictCode: source?.dictCode,
    dictSort: source?.dictSort ?? 0,
    dictLabel: source?.dictLabel || "",
    dictValue: source?.dictValue || "",
    dictType: source?.dictType || dictType,
    cssClass: source?.cssClass || "",
    listClass: source?.listClass || "",
    isDefault: source?.isDefault || "N",
    status: source?.status ?? 2,
    remark: source?.remark || "",
  };
}

export function DictsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const params = useParams<{ dictId?: string }>();
  const [typeKeyword, setTypeKeyword] = useState("");
  const [dataKeyword, setDataKeyword] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(params.dictId ? Number(params.dictId) : null);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [typeDraft, setTypeDraft] = useState<DictTypeDraft>(createTypeDraft());
  const [dataDraft, setDataDraft] = useState<DictDataDraft>(createDataDraft());
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const typesQuery = useQuery({
    queryKey: ["admin-page", "dict-types", typeKeyword],
    queryFn: () =>
      api.admin.listDictTypes({
        pageIndex: 1,
        pageSize: 200,
        dictName: typeKeyword || undefined,
      }),
  });
  const selectedType = useMemo(
    () => (typesQuery.data?.list || []).find((item) => item.id === selectedTypeId) || null,
    [selectedTypeId, typesQuery.data],
  );
  const dataQuery = useQuery({
    enabled: Boolean(selectedType?.dictType),
    queryKey: ["admin-page", "dict-data", selectedType?.dictType, dataKeyword],
    queryFn: () =>
      api.admin.listDictData({
        dictType: selectedType?.dictType,
        dictLabel: dataKeyword || undefined,
        pageIndex: 1,
        pageSize: 200,
      }),
  });
  const typeMutation = useMutation({
    mutationFn: async (payload: DictTypeDraft) => {
      const nextPayload = {
        id: payload.id,
        dictName: payload.dictName,
        dictType: payload.dictType,
        status: payload.status,
        remark: payload.remark,
      };
      if (payload.id) {
        return api.admin.updateDictType(nextPayload as { id: number });
      }
      return api.admin.createDictType(nextPayload);
    },
    onSuccess: async (_result, payload) => {
      setFeedback({
        tone: "success",
        message: payload.id ? "字典类型已更新" : "字典类型已创建",
      });
      setTypeDialogOpen(false);
      setTypeDraft(createTypeDraft());
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "dict-types"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "字典类型保存失败",
      });
    },
  });
  const dataMutation = useMutation({
    mutationFn: async (payload: DictDataDraft) => {
      const nextPayload = {
        dictCode: payload.dictCode,
        dictSort: payload.dictSort,
        dictLabel: payload.dictLabel,
        dictValue: payload.dictValue,
        dictType: payload.dictType,
        cssClass: payload.cssClass,
        listClass: payload.listClass,
        isDefault: payload.isDefault,
        status: payload.status,
        remark: payload.remark,
      };
      if (payload.dictCode) {
        return api.admin.updateDictData(nextPayload as { dictCode: number });
      }
      return api.admin.createDictData(nextPayload);
    },
    onSuccess: async (_result, payload) => {
      setFeedback({
        tone: "success",
        message: payload.dictCode ? "字典数据已更新" : "字典数据已创建",
      });
      setDataDialogOpen(false);
      setDataDraft(createDataDraft(selectedType?.dictType || ""));
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "dict-data"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "字典数据保存失败",
      });
    },
  });
  const typeDeleteMutation = useMutation({
    mutationFn: async (id: number) => api.admin.deleteDictTypes({ ids: [id] }),
    onSuccess: async (_result, id) => {
      setFeedback({
        tone: "success",
        message: "字典类型已删除",
      });
      if (selectedTypeId === id) {
        setSelectedTypeId(null);
        navigate("/admin/dict");
      }
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "dict-types"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "字典类型删除失败",
      });
    },
  });
  const dataDeleteMutation = useMutation({
    mutationFn: async (dictCode: number) => api.admin.deleteDictData({ ids: [dictCode] }),
    onSuccess: async () => {
      setFeedback({
        tone: "success",
        message: "字典数据已删除",
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "dict-data"] });
    },
    onError: (error) => {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "字典数据删除失败",
      });
    },
  });

  useEffect(() => {
    if (params.dictId) {
      setSelectedTypeId(Number(params.dictId));
      return;
    }
    if (!selectedTypeId && (typesQuery.data?.list || []).length > 0) {
      setSelectedTypeId(typesQuery.data?.list[0]?.id || null);
    }
  }, [params.dictId, selectedTypeId, typesQuery.data]);

  function selectType(item: SysDictTypeRecord) {
    setSelectedTypeId(item.id);
    navigate(`/admin/dict/data/${item.id}`);
  }

  function openCreateTypeDialog() {
    setTypeDraft(createTypeDraft());
    setTypeDialogOpen(true);
  }

  function openEditTypeDialog(item: SysDictTypeRecord) {
    setTypeDraft(createTypeDraft(item));
    setTypeDialogOpen(true);
  }

  async function handleDeleteType(item: SysDictTypeRecord) {
    if (!window.confirm(`确认删除字典类型「${item.dictName}」吗？`)) {
      return;
    }
    typeDeleteMutation.mutate(item.id);
  }

  function openCreateDataDialog() {
    if (!selectedType) {
      setFeedback({
        tone: "error",
        message: "请先选择字典类型",
      });
      window.alert("请先选择字典类型");
      return;
    }
    setDataDraft(createDataDraft(selectedType.dictType));
    setDataDialogOpen(true);
  }

  function openEditDataDialog(item: SysDictDataRecord) {
    setDataDraft(createDataDraft(selectedType?.dictType || "", item));
    setDataDialogOpen(true);
  }

  async function handleDeleteData(item: SysDictDataRecord) {
    if (!window.confirm(`确认删除字典数据「${item.dictLabel}」吗？`)) {
      return;
    }
    dataDeleteMutation.mutate(item.dictCode);
  }

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Admin Module</small>
        <h2>字典管理</h2>
        <p>字典类型和字典数据已经切换到双层 CRUD 模式，支持从菜单路由直接进入指定字典。</p>
      </header>
      {feedback ? <p className={`inline-feedback${feedback.tone === "error" ? " error" : ""}`}>{feedback.message}</p> : null}

      <div className="two-column-grid">
        <SectionCard title="字典类型" description="左侧管理类型，右侧只显示当前选中类型下的数据。">
          <div className="search-grid single-column">
            <label className="search-field">
              <span>字典名称</span>
              <input onChange={(event) => setTypeKeyword(event.target.value)} placeholder="按名称过滤" value={typeKeyword} />
            </label>
          </div>
          <div className="inline-actions">
            <button className="primary-action" onClick={openCreateTypeDialog} type="button">
              新增类型
            </button>
          </div>
          <div className="stack-list">
            {(typesQuery.data?.list || []).map((item) => (
              <article className={`stack-item${selectedTypeId === item.id ? " active" : ""}`} key={item.id}>
                <button className="stack-item-main" onClick={() => selectType(item)} type="button">
                  <strong>{item.dictName}</strong>
                  <span>{item.dictType}</span>
                </button>
                <div className="row-actions">
                  <button className="tiny-action" onClick={() => openEditTypeDialog(item)} type="button">
                    编辑
                  </button>
                  <button className="tiny-action danger" onClick={() => void handleDeleteType(item)} type="button">
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="字典数据"
          description={selectedType ? `当前类型：${selectedType.dictName} / ${selectedType.dictType}` : "先从左侧选择字典类型。"}
        >
          <div className="search-grid single-column">
            <label className="search-field">
              <span>数据标签</span>
              <input onChange={(event) => setDataKeyword(event.target.value)} placeholder="按标签过滤" value={dataKeyword} />
            </label>
          </div>
          <div className="inline-actions">
            <button className="primary-action" disabled={!selectedType} onClick={openCreateDataDialog} type="button">
              新增数据
            </button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>标签</th>
                  <th>值</th>
                  <th>排序</th>
                  <th>默认</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {(dataQuery.data?.list || []).map((item) => (
                  <tr key={item.dictCode}>
                    <td>{item.dictLabel}</td>
                    <td>{item.dictValue}</td>
                    <td>{item.dictSort}</td>
                    <td>{item.isDefault === "Y" ? "是" : "否"}</td>
                    <td>{item.status === 2 ? "正常" : "停用"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="tiny-action" onClick={() => openEditDataDialog(item)} type="button">
                          编辑
                        </button>
                        <button className="tiny-action danger" onClick={() => void handleDeleteData(item)} type="button">
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
      </div>

      {typeDialogOpen ? (
        <div className="modal-mask">
          <div className="modal-card compact-modal">
            <h3>{typeDraft.id ? "编辑字典类型" : "新增字典类型"}</h3>
            <div className="form-grid">
              <label className="form-field">
                <span>字典名称</span>
                <input
                  onChange={(event) =>
                    setTypeDraft((current) => ({
                      ...current,
                      dictName: event.target.value,
                    }))
                  }
                  value={typeDraft.dictName}
                />
              </label>
              <label className="form-field">
                <span>字典类型</span>
                <input
                  onChange={(event) =>
                    setTypeDraft((current) => ({
                      ...current,
                      dictType: event.target.value,
                    }))
                  }
                  value={typeDraft.dictType}
                />
              </label>
              <label className="form-field">
                <span>状态</span>
                <select
                  onChange={(event) =>
                    setTypeDraft((current) => ({
                      ...current,
                      status: Number(event.target.value),
                    }))
                  }
                  value={String(typeDraft.status)}
                >
                  <option value="2">正常</option>
                  <option value="1">停用</option>
                </select>
              </label>
              <label className="form-field">
                <span>备注</span>
                <textarea
                  onChange={(event) =>
                    setTypeDraft((current) => ({
                      ...current,
                      remark: event.target.value,
                    }))
                  }
                  rows={3}
                  value={typeDraft.remark}
                />
              </label>
            </div>
            <div className="inline-actions">
              <button
                className="primary-action"
                disabled={typeMutation.isPending || !typeDraft.dictName.trim() || !typeDraft.dictType.trim()}
                onClick={() => typeMutation.mutate(typeDraft)}
                type="button"
              >
                {typeMutation.isPending ? "保存中..." : "保存类型"}
              </button>
              <button className="soft-link" onClick={() => setTypeDialogOpen(false)} type="button">
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {dataDialogOpen ? (
        <div className="modal-mask">
          <div className="modal-card">
            <h3>{dataDraft.dictCode ? "编辑字典数据" : "新增字典数据"}</h3>
            <div className="form-grid two-columns">
              <label className="form-field">
                <span>所属字典</span>
                <input disabled value={dataDraft.dictType} />
              </label>
              <label className="form-field">
                <span>排序</span>
                <input
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      dictSort: Number(event.target.value),
                    }))
                  }
                  type="number"
                  value={String(dataDraft.dictSort)}
                />
              </label>
              <label className="form-field">
                <span>标签</span>
                <input
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      dictLabel: event.target.value,
                    }))
                  }
                  value={dataDraft.dictLabel}
                />
              </label>
              <label className="form-field">
                <span>值</span>
                <input
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      dictValue: event.target.value,
                    }))
                  }
                  value={dataDraft.dictValue}
                />
              </label>
              <label className="form-field">
                <span>样式类</span>
                <input
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      cssClass: event.target.value,
                    }))
                  }
                  value={dataDraft.cssClass}
                />
              </label>
              <label className="form-field">
                <span>列表类</span>
                <input
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      listClass: event.target.value,
                    }))
                  }
                  value={dataDraft.listClass}
                />
              </label>
              <label className="form-field">
                <span>默认值</span>
                <select
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      isDefault: event.target.value,
                    }))
                  }
                  value={dataDraft.isDefault}
                >
                  <option value="N">否</option>
                  <option value="Y">是</option>
                </select>
              </label>
              <label className="form-field">
                <span>状态</span>
                <select
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      status: Number(event.target.value),
                    }))
                  }
                  value={String(dataDraft.status)}
                >
                  <option value="2">正常</option>
                  <option value="1">停用</option>
                </select>
              </label>
              <label className="form-field">
                <span>备注</span>
                <textarea
                  onChange={(event) =>
                    setDataDraft((current) => ({
                      ...current,
                      remark: event.target.value,
                    }))
                  }
                  rows={3}
                  value={dataDraft.remark}
                />
              </label>
            </div>
            <div className="inline-actions">
              <button
                className="primary-action"
                disabled={dataMutation.isPending || !dataDraft.dictLabel.trim() || !dataDraft.dictValue.trim()}
                onClick={() => dataMutation.mutate(dataDraft)}
                type="button"
              >
                {dataMutation.isPending ? "保存中..." : "保存数据"}
              </button>
              <button className="soft-link" onClick={() => setDataDialogOpen(false)} type="button">
                取消
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
