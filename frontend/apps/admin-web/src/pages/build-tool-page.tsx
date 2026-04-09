import { ToolLinkPage } from "./tool-link-page";

function resolveToolUrl(path: string) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return new URL(path, baseURL).toString();
}

export function BuildToolPage() {
  return (
    <ToolLinkPage
      description="可视化表单构建工具。"
      links={[
        {
          label: "表单构建器",
          href: resolveToolUrl("/form-generator"),
          note: "由后端提供的静态页面。",
        },
      ]}
      notes={[]}
      title="表单构建"
    />
  );
}
