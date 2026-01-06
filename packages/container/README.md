# @xz-summer/milkdown-container

Milkdown 容器指令插件 - 支持 info、tip、warning、danger 和 details 容器。

## 安装

```bash
npm install @xz-summer/milkdown-container
# 或
pnpm add @xz-summer/milkdown-container
```

## 使用

```typescript
import { Editor } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { containerPlugin } from "@xz-summer/milkdown-container";
import "@xz-summer/milkdown-container/style.css";

const editor = await Editor.make()
  .use(commonmark)
  .use(containerPlugin)
  .create();
```

## Markdown 语法

```markdown
:::info[信息标题]
这是一个信息容器
:::

:::tip[提示]
这是一个提示容器
:::

:::warning[警告]
这是一个警告容器
:::

:::danger[危险]
这是一个危险容器
:::

:::details[点击展开]
这是一个可折叠容器
:::
```

## 容器类型

| 类型 | 别名 | 说明 |
|------|------|------|
| `info` | `note` | 信息提示 |
| `tip` | `hint` | 小贴士 |
| `warning` | `warn`, `caution` | 警告 |
| `danger` | `error` | 危险/错误 |
| `details` | `detail`, `collapse`, `collapsible` | 可折叠 |

## 快捷输入

在编辑器中输入以下内容后按回车即可创建容器：

```
:::info[标题]
:::tip
:::warning
:::danger
:::details[详情]
```

## 自定义属性

支持添加自定义 class 和属性：

```markdown
:::info[标题]{.custom-class #my-id data-custom="value"}
内容
:::
```

## 命令

```typescript
import { createContainerCommand } from "@xz-summer/milkdown-container";

// 创建容器
ctx.get(commandsCtx).call(createContainerCommand.key, "info", "自定义标题");
```

## 许可证

MIT
