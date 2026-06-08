# @lee67892/milkdown-mermaid

Milkdown 的 Mermaid 图表插件，支持在代码块中渲染流程图、时序图、甘特图等，并提供 SVG 预览的缩放与拖拽能力。

## 安装

```bash
npm install @lee67892/milkdown-mermaid mermaid
# 或
pnpm add @lee67892/milkdown-mermaid mermaid
```

## 使用

```ts
import { mermaidPlugin, mermaidConfig, mergeMermaidConfig } from '@lee67892/milkdown-mermaid'
import '@lee67892/milkdown-mermaid/style.css'

editor
  .use(mermaidPlugin)
  .config((ctx) => {
    ctx.update(mermaidConfig.key, mergeMermaidConfig({
      mermaidOptions: {
        theme: 'default',
        securityLevel: 'loose',
      },
      zoomable: true,
      pannable: true,
      showToolbar: true,
      fitToContainer: true,
    }))
  })
```

## 新增交互能力

- 鼠标滚轮缩放 Mermaid SVG
- 按住左键拖拽平移图表
- 内置工具栏：放大、缩小、1:1、适应容器
- 支持通过配置关闭缩放、拖拽或工具栏

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mermaidOptions` | `MermaidConfig` | `{ startOnLoad: false, theme: 'default', securityLevel: 'loose' }` | Mermaid 初始化配置 |
| `placeholder` | `string` | `'渲染中...'` | 渲染时占位文本 |
| `errorPrefix` | `string` | `'Mermaid Error: '` | 错误信息前缀 |
| `zoomable` | `boolean` | `true` | 是否允许滚轮与按钮缩放 |
| `pannable` | `boolean` | `true` | 是否允许鼠标拖拽平移 |
| `showToolbar` | `boolean` | `true` | 是否显示预览工具栏 |
| `minScale` | `number` | `0.25` | 最小缩放比例 |
| `maxScale` | `number` | `4` | 最大缩放比例 |
| `initialScale` | `number` | `1` | 初始缩放比例 |
| `fitToContainer` | `boolean` | `true` | 渲染后是否自动适应容器 |

## 斜杠菜单集成

插件导出了 `mermaidSlashMenuItem`，可直接用于斜杠菜单：

```ts
import { mermaidSlashMenuItem } from '@lee67892/milkdown-mermaid'
import { menuRegistryCtx, DEFAULT_GROUP_IDS } from '@xz-summer/milkdown-slash-menu-vue'

editor.config((ctx) => {
  const registry = ctx.get(menuRegistryCtx.key)
  registry.registerItem(DEFAULT_GROUP_IDS.ADVANCED, mermaidSlashMenuItem)
})
```

## 命令

插件提供 `insertMermaidCommand` 命令，可程序化插入 Mermaid 代码块：

```ts
import { insertMermaidCommand } from '@lee67892/milkdown-mermaid'

commands.call(insertMermaidCommand.key)
```

## 发布

仓库已包含 GitHub Actions 发布流水线。向 `main` 分支推送带 `v*` 标签的提交后，会自动构建并发布到 npm。

需要在 GitHub 仓库 `Settings -> Secrets and variables -> Actions` 中配置：

- `NPM_TOKEN`

## License

MIT
