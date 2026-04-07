import { ToolLinkPage } from "./tool-link-page";

function resolveToolUrl(path: string) {
  const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  return new URL(path, baseURL).toString();
}

export function BuildToolPage() {
  return (
    <ToolLinkPage
      description="表单构建继续复用后端托管的旧工具页面，保证开发工具菜单完整可达。"
      links={[
        {
          label: "表单构建器",
          href: resolveToolUrl("/form-generator"),
          note: "当前仍由后端静态资源提供，是后台菜单中的稳定桥接入口。",
        },
      ]}
      notes={[
        "本轮目标是后台业务页完整可用，开发工具页继续采用桥接策略。",
        "如果后续决定把表单构建 React 化，应单独拆成字段编辑器、预览器和导出流程。",
      ]}
      title="表单构建"
    />
  );
}
