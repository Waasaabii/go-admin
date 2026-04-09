# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本目录中工作时提供指引。

## 包：@go-admin/ui-admin

PC 端管理后台布局组件库。提供 admin-web 应用使用的通用 UI 组件。

## 导出组件

| 组件 | 用途 |
|------|------|
| `AdminShell` | 主布局外壳（侧边栏 + 主内容区） |
| `BrandBlock` | 品牌标识区（标题 + 口号） |
| `IdentityCard` | 用户身份卡片（头像、名称、角色、租户） |
| `TreeNav` | 递归菜单导航树（基于 `AppMenuNode[]`，使用 React Router `NavLink`） |
| `MetricGrid` / `MetricCard` | 指标网格布局 / 单个指标卡片 |
| `SectionCard` | 分区卡片（标题 + 描述 + 内容） |

## 导出入口

- `./src/index.tsx` — 组件导出
- `./src/styles.css` — 组件样式（通过 `@go-admin/ui-admin/styles.css` 导入）

## 依赖

- `react` / `react-router-dom` — React 和路由
- `@go-admin/types` — `AppMenuNode` 类型

## 滚动规则

- `AppScrollbar` 是后台局部滚动的唯一基础设施，侧栏、弹窗正文、搜索结果、树列表、代码块、表格横向滚动等场景默认通过它承载。
- 不要在公共组件内部直接写 `overflow-y-auto`、`overflow-x-auto`、`overflow-auto` 作为滚动实现；若需要滚动，优先补进现有公共组件或内置 `AppScrollbar`。
- 页面主内容区不属于 `AppScrollbar` 规则范围，保持原生滚动，避免影响锚点、返回顶部和浏览器滚动语义。
- 如果某个组件确实需要把滚动目标暴露给 `Backtop`、`Anchor` 一类能力，优先扩展 `AppScrollbar` 的 viewport 能力，而不是退回原生滚动容器。

## 开发命令

```bash
pnpm build       # tsc 编译
pnpm typecheck   # 类型检查
```
