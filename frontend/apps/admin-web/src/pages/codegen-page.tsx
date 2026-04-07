import { ToolLinkPage } from "./tool-link-page";

function resolveToolUrl(path: string) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return new URL(path, baseURL).toString();
}

export function CodegenPage() {
  return (
    <ToolLinkPage
      description="代码生成暂时桥接后端已有能力，避免在后台 React 重构阶段同时重写生成器。"
      links={[
        {
          label: "表单生成器",
          href: resolveToolUrl("/form-generator"),
          note: "后端已托管静态资源，可直接打开旧生成器页面。",
        },
        {
          label: "数据表接口",
          href: resolveToolUrl("/admin-api/v1/db/tables/page"),
          note: "用于确认生成器依赖的数据表列表接口是否可达。",
        },
      ]}
      notes={[
        "这类开发工具不属于高频业务操作，先桥接旧能力，比仓促重写更稳。",
        "后续如果要完全 React 化，应单独拆成数据表选择、字段编辑、预览三个子页面。",
      ]}
      title="代码生成"
    />
  );
}
