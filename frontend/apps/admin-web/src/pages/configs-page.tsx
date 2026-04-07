import { CrudDataPage } from "../components/crud-data-page";
import { createApiClient } from "@suiyuan/api";
import type { SysConfigRecord } from "@suiyuan/types";

export function ConfigsPage({ api }: { api: ReturnType<typeof createApiClient> }) {
  return (
    <CrudDataPage<SysConfigRecord>
      columns={[
        { label: "参数名称", render: (row) => row.configName as string },
        { label: "参数键名", render: (row) => row.configKey as string },
        { label: "参数值", render: (row) => row.configValue as string },
        { label: "类型", render: (row) => row.configType as string },
        { label: "前台配置", render: (row) => (String(row.isFrontend) === "1" ? "是" : "否") },
        { label: "备注", render: (row) => (row.remark as string) || "-" },
      ]}
      createDraft={() => ({
        configName: "",
        configKey: "",
        configValue: "",
        configType: "Y",
        isFrontend: "0",
        remark: "",
      })}
      createItem={(payload) => api.admin.createConfig(payload)}
      deleteItem={(payload) => api.admin.deleteConfigs(payload)}
      description="参数管理先接入列表与编辑，系统设置页单独保留在 `/admin/sys-config/set`。"
      fetcher={(params) => api.admin.listConfigs(params)}
      formFields={[
        { key: "configName", label: "参数名称" },
        { key: "configKey", label: "参数键名" },
        { key: "configValue", label: "参数值", type: "textarea" },
        {
          key: "configType",
          label: "系统内置",
          type: "select",
          options: [
            { label: "是", value: "Y" },
            { label: "否", value: "N" },
          ],
        },
        {
          key: "isFrontend",
          label: "前台配置",
          type: "select",
          options: [
            { label: "是", value: "1" },
            { label: "否", value: "0" },
          ],
        },
        { key: "remark", label: "备注", type: "textarea" },
      ]}
      getRowId={(item) => Number(item.id)}
      queryKey="configs"
      searchFields={[
        { key: "configName", label: "参数名称", placeholder: "按名称过滤" },
        { key: "configKey", label: "参数键名", placeholder: "按键名过滤" },
      ]}
      title="参数管理"
      updateItem={(payload) => api.admin.updateConfig(payload as { id: number })}
    />
  );
}
