# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在本目录中工作时提供指引。

## 包：@suiyuan/design-tokens

设计令牌包，定义主题 token 契约、默认主题与基础全局样式。

## 导出

- `src/index.ts` — 导出 `brandTokens` 对象（JavaScript 中使用的品牌色常量：`colorInk`、`colorMuted`、`colorAccent`、`colorHighlight`、`colorCanvas`）
- `src/base.css` — 基础 reset 与全局基础行为，不带品牌视觉
- `src/default-theme.css` — 默认主题变量
- `src/host-theme-template.css` — 宿主项目主题模板
- `src/theme.css` — 兼容入口，等价于 `base.css + default-theme.css`

## CSS 变量清单

| 变量 | 用途 |
|------|------|
| `--font-display` / `--font-sans` | 标题字体 / 正文字体 |
| `--color-ink` / `--color-muted` | 主文字色 / 次要文字色 |
| `--color-canvas` / `--color-panel` | 背景色 / 面板色 |
| `--color-accent` / `--color-accent-soft` | 强调色（teal）/ 浅强调色 |
| `--color-highlight` / `--color-highlight-soft` | 高亮色（orange）/ 浅高亮色 |
| `--radius-sm/md/lg` | 圆角大小（14/22/32px） |
| `--shadow-soft` / `--shadow-float` | 阴影效果 |
| `--grid-gap` | 网格间距 |

## 使用方式

默认主题应用可在入口处导入：

```css
@import "@suiyuan/design-tokens/base.css";
@import "@suiyuan/design-tokens/default-theme.css";
```

宿主项目接管主题时，只引入 `base.css`，再按 `host-theme-template.css` 的 token 结构提供自己的主题文件。

## 开发命令

```bash
pnpm build       # tsc 编译
pnpm typecheck   # 类型检查
```
