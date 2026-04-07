# Frontend Workspace

## 目录

- `apps/admin-web`：后台管理前端
- `apps/mobile-h5`：移动端用户前端
- `packages/api`：接口请求与响应解包
- `packages/auth`：登录态与 token 存储
- `packages/core`：租户与菜单适配工具
- `packages/design-tokens`：设计变量
- `packages/ui-admin`：后台组件
- `packages/ui-mobile`：移动组件

## 常用命令

在仓库根目录执行：

```bash
pnpm install --store-dir ./.pnpm-store
pnpm dev:admin
pnpm dev:mobile
pnpm typecheck
pnpm test
pnpm build
```

## 环境变量

两个应用都支持：

- `VITE_API_BASE_URL`：正式 API 地址，留空时走同源
- `VITE_PROXY_TARGET`：本地开发代理地址，默认 `http://127.0.0.1:18123`
- `VITE_TENANT_CODE`：本地开发时的租户回退值，默认 `local`

生产环境推荐按域名或子域部署，由前端自动识别租户编码。
