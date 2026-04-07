import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { SectionCard } from "@suiyuan/ui-admin";
import { createApiClient } from "@suiyuan/api";

export function SetConfigPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string>("");
  const configQuery = useQuery({
    queryKey: ["admin-page", "set-config"],
    queryFn: () => api.admin.getSetConfig(),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: Array<{ configKey: string; configValue: string }>) => api.admin.updateSetConfig(payload),
    onSuccess: async () => {
      setFeedback("系统设置已保存");
      await queryClient.invalidateQueries({ queryKey: ["admin-page", "set-config"] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "系统设置保存失败");
    },
  });
  const changedEntries = useMemo(() => {
    const base = configQuery.data || {};
    return Object.entries(draft).filter(([key, value]) => base[key] !== value);
  }, [configQuery.data, draft]);

  useEffect(() => {
    if (configQuery.data) {
      setDraft(configQuery.data);
    }
  }, [configQuery.data]);

  return (
    <div className="page-stack">
      <header className="page-hero compact">
        <small>Admin Module</small>
        <h2>参数设置</h2>
        <p>这一页对应旧后台 `set-config`，用键值卡片直接编辑当前系统设置。</p>
      </header>
      <div className="module-grid">
        <SectionCard title="配置项" description="界面设置型参数先保留简洁编辑方式，不拆复杂表单。">
          <div className="form-grid">
            {Object.entries(draft).map(([key, value]) => (
              <label className="form-field" key={key}>
                <span>{key}</span>
                <textarea
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  rows={3}
                  value={value}
                />
              </label>
            ))}
          </div>
          <div className="inline-actions">
            <button
              className="primary-action"
              disabled={saveMutation.isPending || changedEntries.length === 0}
              onClick={() =>
                void saveMutation.mutateAsync(
                  Object.entries(draft).map(([configKey, configValue]) => ({
                    configKey,
                    configValue,
                  })),
                )
              }
              type="button"
            >
              {saveMutation.isPending ? "保存中..." : "保存设置"}
            </button>
            <button
              className="soft-link"
              onClick={() => {
                setDraft(configQuery.data || {});
                setFeedback("");
              }}
              type="button"
            >
              恢复当前服务端值
            </button>
          </div>
          {feedback ? <p className="inline-feedback">{feedback}</p> : null}
        </SectionCard>
        <SectionCard title="联调状态" description="这里用于确认 set-config 接口已真正形成前后端闭环。">
          <dl className="detail-grid">
            <dt>配置项总数</dt>
            <dd>{Object.keys(draft).length}</dd>
            <dt>待保存项</dt>
            <dd>{changedEntries.length}</dd>
            <dt>加载状态</dt>
            <dd>{configQuery.isLoading ? "加载中" : "已加载"}</dd>
            <dt>保存状态</dt>
            <dd>{saveMutation.isPending ? "保存中" : "空闲"}</dd>
          </dl>
          <ul className="detail-list">
            <li>这一页聚合的是运行中的系统设置，不等同于参数管理列表页。</li>
            <li>只有存在改动时才允许提交，避免空保存掩盖真实联调结果。</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
