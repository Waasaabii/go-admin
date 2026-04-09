# 前端国际化后续待办

## 当前状态

- 已完成共享国际化底座：`frontend/packages/i18n`
- 已完成 `ui-showcase` 壳层、路由元数据、Overview、搜索与公共文档框架国际化
- 已完成 `admin-web` 入口层、加载态、登录页、仪表盘、安装向导、公共 CRUD 模板国际化

## 下一步优先级

### 1. `ui-showcase` 组件文档正文国际化

目标：继续把结构说明从 TSX 页面中抽离到消息表，避免只做到壳层双语。

优先文件：

- `frontend/apps/ui-showcase/src/showcase-routes/actions.tsx`
- `frontend/apps/ui-showcase/src/showcase-routes/forms.tsx`
- `frontend/apps/ui-showcase/src/showcase-routes/feedback.tsx`
- `frontend/apps/ui-showcase/src/showcase-routes/data.tsx`
- `frontend/apps/ui-showcase/src/showcase-routes/layouts.tsx`
- `frontend/apps/ui-showcase/src/i18n/showcase.ts`

重点迁移内容：

- `ShowcaseDocPage` 的 `description`
- `notes`
- demo 标题与 demo 说明
- 示例中的结构性辅助文案
- 公共 API 描述中仍硬编码的说明文本

### 2. `admin-web` 继续从公共模板向业务页扩散

目标：优先做“公共收益最大”的页面模板和高频入口页，不要一口气散到所有业务页。

优先文件：

- `frontend/apps/admin-web/src/pages/module-page.tsx`
- `frontend/apps/admin-web/src/pages/tool-link-page.tsx`
- `frontend/apps/admin-web/src/pages/users-page.tsx`
- `frontend/apps/admin-web/src/pages/roles-page.tsx`
- `frontend/apps/admin-web/src/pages/menus-page.tsx`
- `frontend/apps/admin-web/src/pages/depts-page.tsx`

重点迁移内容：

- 页面标题、说明、空态、错误态
- toast 成功/失败消息
- 弹窗标题与确认文案
- 表单校验文案
- 详情页辅助说明

### 3. 菜单双语方案单独评估

风险说明：

- `menuTree/currentMenu.title` 来自后端菜单数据
- 当前前端国际化不能自动把侧栏菜单和当前菜单标题切成双语
- 如果需要菜单也双语，要单独决定：
  - 后端返回多语言字段
  - 或前端建立 `path -> i18n key` 映射层

## 建议执行顺序

1. 先完成 `ui-showcase` 五个 routes 文件的正文迁移
2. 再完成 `admin-web` 的 `module-page` 与 `tool-link-page`
3. 然后批量推进 `users / roles / menus / depts`
4. 最后评估菜单双语方案是否需要后端配合

## 恢复工作前建议验证

```bash
pnpm --filter @go-admin/i18n typecheck
pnpm --filter @go-admin/ui-showcase typecheck
pnpm --filter @go-admin/admin-web typecheck
```
