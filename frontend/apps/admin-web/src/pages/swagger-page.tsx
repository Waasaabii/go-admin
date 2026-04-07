import { ToolLinkPage } from "./tool-link-page";

function resolveToolUrl(path: string) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return new URL(path, baseURL).toString();
}

export function SwaggerPage() {
  return (
    <ToolLinkPage
      description="Swagger 保留为后端原生页面入口，便于联调和校验镜像 API 前缀。"
      links={[
        {
          label: "Swagger 文档",
          href: resolveToolUrl("/swagger/admin/index.html"),
          note: "直接进入后端 swagger UI，适合核对 admin-api 与 app-api 的真实接口响应。",
        },
      ]}
      notes={[
        "这一步先保证工具页在新后台里有稳定入口，不急着把 Swagger 重写成 React 页面。",
        "如果前后端部署在不同域名，链接会直接跳转到 API 域名。",
      ]}
      title="系统接口"
    />
  );
}
