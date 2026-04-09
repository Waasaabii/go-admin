import { ToolLinkPage } from "./tool-link-page";

function resolveToolUrl(path: string) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return new URL(path, baseURL).toString();
}

export function CodegenPage() {
  return (
    <ToolLinkPage
      description="根据数据表结构自动生成 CRUD 业务代码。"
      links={[
        {
          label: "表单生成器",
          href: resolveToolUrl("/form-generator"),
          note: "由后端提供的静态页面。",
        },
        {
          label: "数据表列表",
          href: resolveToolUrl("/admin-api/v1/db/tables/page"),
          note: "查看可用于生成代码的数据表。",
        },
      ]}
      notes={[]}
      title="代码生成"
    />
  );
}
