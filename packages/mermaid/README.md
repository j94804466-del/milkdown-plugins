# @xz-summer/milkdown-mermaid

Milkdown 的 Mermaid 图表插件，支持在代码块中渲染流程图、时序图、甘特图等。

## 安装

```bash
npm install @xz-summer/milkdown-mermaid mermaid
# 或
pnpm add @xz-summer/milkdown-mermaid mermaid
```

## 使用

```ts
import { mermaidPlugin, mermaidConfig, mergeMermaidConfig } from '@xz-summer/milkdown-mermaid'
import '@xz-summer/milkdown-mermaid/style.css'

editor
  .use(mermaidPlugin)
  .config((ctx) => {
    // 可选：自定义配置
    ctx.update(mermaidConfig.key, mergeMermaidConfig({
      mermaidOptions: {
        theme: 'dark',
        securityLevel: 'strict',
      },
      placeholder: '加载中...',
    }))
  })
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mermaidOptions` | `MermaidConfig` | `{ startOnLoad: false, theme: 'default', securityLevel: 'loose' }` | Mermaid 初始化配置 |
| `placeholder` | `string` | `'渲染中...'` | 渲染时的占位符文本 |
| `errorPrefix` | `string` | `'Mermaid Error: '` | 错误信息前缀 |

## 斜杠菜单集成

插件导出了 `mermaidSlashMenuItem`，可直接用于斜杠菜单：

```ts
import { mermaidSlashMenuItem } from '@xz-summer/milkdown-mermaid'
import { menuRegistryCtx, DEFAULT_GROUP_IDS } from '@xz-summer/milkdown-slash-menu-vue'

editor.config((ctx) => {
  const registry = ctx.get(menuRegistryCtx.key)
  registry.registerItem(DEFAULT_GROUP_IDS.ADVANCED, mermaidSlashMenuItem)
})
```

## 命令

插件提供 `insertMermaidCommand` 命令，可程序化插入 mermaid 代码块：

```ts
import { insertMermaidCommand } from '@xz-summer/milkdown-mermaid'
import { callCommand } from '@milkdown/kit/utils'

// 在某处调用
callCommand(insertMermaidCommand.key)(ctx)
```

## 支持的图表类型

- 流程图 (Flowchart)
- 时序图 (Sequence Diagram)
- 甘特图 (Gantt Chart)
- 类图 (Class Diagram)
- 状态图 (State Diagram)
- 实体关系图 (ER Diagram)
- 饼图 (Pie Chart)
- 等等...

详见 [Mermaid 官方文档](https://mermaid.js.org/)

## License

MIT
