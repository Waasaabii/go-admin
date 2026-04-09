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

## 主题接入

- `@suiyuan/design-tokens/base.css`：基础 reset 与全局基础行为，不携带品牌视觉。
- `@suiyuan/design-tokens/default-theme.css`：仓库当前默认主题，现有应用显式引入它。
- `@suiyuan/design-tokens/host-theme-template.css`：宿主项目主题模板，按同名 token 提供值即可接管组件库样式。
- `@suiyuan/design-tokens/theme.css`：兼容入口，等价于 `base.css + default-theme.css`。

宿主项目推荐入口顺序：

```css
@import "@suiyuan/design-tokens/base.css";
@import "./your-host-theme.css";
```

当前仓库内的 `apps/admin-web` 已按这个模式接入，主题定义位于 `apps/admin-web/src/admin-host-theme.css`。

## 常用命令

在仓库根目录执行：

```bash
go build -o ./devctl ./tools/devctl
./devctl setup
./devctl service start backend
./devctl service start admin
./devctl service start mobile
pnpm typecheck
pnpm test
pnpm build
```

## 环境变量

两个应用都支持：

- `VITE_API_BASE_URL`：正式 API 地址，留空时走同源
- `VITE_PROXY_TARGET`：本地开发代理地址，默认 `http://127.0.0.1:18123`
- `VITE_TENANT_CODE`：本地开发时的租户回退值，默认 `local`

本地开发推荐先执行：

```bash
go build -o ./devctl ./tools/devctl
./devctl service start postgres redis
./devctl service start backend
./devctl service start admin
```

- Docker 项目前缀默认取仓库根 `package.json.name`，当前仓库默认值为 `go-admin`
- `./devctl service start postgres redis`、`./devctl reinit --yes` 等命令都会读取同一个前缀
- 如需覆盖，可使用 `./devctl --project-prefix 你的前缀 ...`
- 如需回到全新安装状态，再执行 `./devctl reinit --yes`

生产环境推荐按域名或子域部署，由前端自动识别租户编码。

## Setup Wizard

- Setup Wizard 依赖独立部署的 `apps/admin-web`，后端在 setup 模式下只暴露 `/api/v1/setup/*` API。
- 首次安装前，请确认 `VITE_API_BASE_URL` 指向目标后端服务，否则前端无法驱动初始化流程。
- 后端是否进入 setup 模式只由配置目录中的 `.installed` 决定，不再根据示例 `settings.yml` 自动跳过。
