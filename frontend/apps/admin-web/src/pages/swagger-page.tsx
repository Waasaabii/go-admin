import { ToolLinkPage } from "./tool-link-page";

function resolveToolUrl(path: string) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return new URL(path, baseURL).toString();
}

export function SwaggerPage() {
  return (
    <ToolLinkPage
      description="查看和调试后端 API 接口文档。"
      links={[
        {
          label: "Swagger 文档",
          href: resolveToolUrl("/swagger/admin/index.html"),
          note: "后端原生 Swagger UI 页面。",
        },
      ]}
      notes={[]}
      title="系统接口"
    />
  );
}
