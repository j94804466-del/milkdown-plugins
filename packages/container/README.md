# @xz-summer/milkdown-container

[Milkdown](https://milkdown.dev) 编辑器的容器指令插件，支持多种容器类型，可自定义配置。

## 特性

- 🎨 7 种内置容器类型（important、info、note、tip、warning、caution、details）
- 🔧 完全可配置（标题、图标、别名）
- 🌙 支持亮色/暗色主题
- ⌨️ 快捷输入支持
- 📦 可折叠的 details 容器

## 安装

```bash
npm install @xz-summer/milkdown-container
# 或
pnpm add @xz-summer/milkdown-container
# 或
yarn add @xz-summer/milkdown-container
```

## 基本使用

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

:::caution[危险]
这是一个危险容器
:::

:::details[点击展开]
这是一个可折叠容器
:::
```

## 内置容器类型

| 类型 | 别名 | 默认标题 | 颜色 |
|------|------|----------|------|
| `important` | - | 重要 | 紫色 |
| `info` | `default` | 信息 | 蓝色 |
| `note` | - | 注意 | 灰色 |
| `tip` | `tips`, `hint` | 提示 | 绿色 |
| `warning` | `warn` | 警告 | 黄色 |
| `caution` | `danger`, `error` | 危险 | 红色 |
| `details` | `detail`, `collapse`, `collapsible` | 详情 | 靛蓝色 |

## 快捷输入

在编辑器中输入以下内容后按 `Enter` 即可创建容器：

```
:::info
:::info[自定义标题]
:::tip
:::warning
:::details[详情]
```

## 自定义属性

支持添加自定义 class、id 和其他属性：

```markdown
:::info[标题]{.custom-class #my-id data-custom="value"}
内容
:::
```


## 自定义配置

### 配置容器类型

使用 `configureContainer` 函数自定义容器类型。**必须在使用插件之前调用**。

```typescript
import { 
  configureContainer, 
  ContainerTypes,
  infoIcon,
  tipIcon,
} from "@xz-summer/milkdown-container";

// 自定义 SVG 图标
const successIcon = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/></svg>`;

// 在使用插件前配置
configureContainer({
  types: [
    // 覆盖现有类型
    { 
      type: ContainerTypes.INFO, 
      title: "Info", 
      icon: infoIcon, 
      aliases: ["information", "default"] 
    },
    // 添加新类型
    { 
      type: "success", 
      title: "成功", 
      icon: successIcon, 
      aliases: ["ok", "done"] 
    },
  ]
});

// 然后使用插件
const editor = await Editor.make()
  .use(commonmark)
  .use(containerPlugin)
  .create();
```

### 配置项说明

```typescript
interface ContainerTypeConfig {
  /** 容器类型标识（必填） */
  type: string;
  /** 默认标题 */
  title: string;
  /** 图标 SVG 字符串 */
  icon: string;
  /** 别名列表（可选） */
  aliases?: string[];
}
```

### 类型常量

插件导出了内置类型常量，方便引用：

```typescript
import { ContainerTypes } from "@xz-summer/milkdown-container";

ContainerTypes.IMPORTANT  // "important"
ContainerTypes.INFO       // "info"
ContainerTypes.NOTE       // "note"
ContainerTypes.TIP        // "tip"
ContainerTypes.WARNING    // "warning"
ContainerTypes.CAUTION    // "caution"
ContainerTypes.DETAILS    // "details"
```

### 添加新类型的 CSS 样式

新增容器类型需要添加对应的 CSS 样式：

```css
/* 新增 success 类型样式 */
.milkdown-container.success {
  background-color: var(--xz-c-green-soft);
}

.milkdown-container.success .milkdown-container-title {
  color: var(--xz-c-green-text);
}
```

## 主题支持

插件内置了亮色和暗色主题支持。通过 `data-theme="dark"` 属性切换：

```html
<div data-theme="dark">
  <!-- 编辑器内容 -->
</div>
```

### CSS 变量

可以通过覆盖 CSS 变量自定义颜色：

```css
:root {
  /* 灰色系 */
  --xz-c-grey-text: #656869;
  --xz-c-grey-soft: rgb(142 150 170 / 14%);
  
  /* 蓝色系 */
  --xz-c-blue-text: #2888a7;
  --xz-c-blue-soft: rgb(27 178 229 / 14%);
  
  /* 绿色系 */
  --xz-c-green-text: #18794e;
  --xz-c-green-soft: rgb(16 185 129 / 14%);
  
  /* 黄色系 */
  --xz-c-yellow-text: #915930;
  --xz-c-yellow-soft: rgb(234 179 8 / 14%);
  
  /* 红色系 */
  --xz-c-red-text: #b8272c;
  --xz-c-red-soft: rgb(244 63 94 / 14%);
  
  /* 紫色系 */
  --xz-c-purple-text: #6f42c1;
  --xz-c-purple-soft: rgb(159 122 234 / 14%);
  
  /* 靛蓝色系 */
  --xz-c-indigo-text: #3451b2;
  --xz-c-indigo-soft: rgb(100 108 255 / 14%);
}
```

## API 参考

### 导出内容

```typescript
// 插件
export { containerPlugin };           // 插件数组，直接用于 editor.use()
export { remarkDirective };           // Remark 指令插件
export { containerSchema };           // 容器节点 Schema
export { containerTitleSchema };      // 容器标题节点 Schema
export { containerContentSchema };    // 容器内容节点 Schema
export { containerNodeView };         // 容器 NodeView
export { containerTitleNodeView };    // 容器标题 NodeView
export { containerKeymap };           // 快捷键插件
export { createContainerCommand };    // 创建容器命令

// 配置
export { configureContainer };        // 配置函数
export { defaultContainerTypes };     // 默认容器类型配置
export { ContainerTypes };            // 类型常量

// 工具函数
export { getContainerConfig };        // 获取容器配置
export { getContainerIcon };          // 获取容器图标
export { getDefaultTitle };           // 获取默认标题

// 图标
export { 
  importantIcon,
  infoIcon,
  noteIcon,
  tipIcon,
  warningIcon,
  cautionIcon,
  detailsIcon,
} from "./icons";

// 类型
export type { ContainerTypeConfig };
export type { ContainerPluginOptions };
```

### 命令使用

```typescript
import { createContainerCommand } from "@xz-summer/milkdown-container";
import { commandsCtx } from "@milkdown/kit/core";

// 创建容器
editor.action((ctx) => {
  ctx.get(commandsCtx).call(createContainerCommand.key, "info", "自定义标题");
});
```

## 输入输出一致性

插件保持输入和输出的一致性。使用别名输入时，输出也会保持原始别名：

| 输入 | 输出 |
|------|------|
| `:::ok` | `:::ok` |
| `:::success` | `:::success` |
| `:::warn` | `:::warn` |
| `:::warning` | `:::warning` |

## 许可证

MIT
