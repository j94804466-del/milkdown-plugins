# @xz-summer/milkdown-slash-menu-react

React 渲染器，用于 [Milkdown](https://milkdown.dev) 斜杠菜单插件。

> 📖 [English Documentation](./README.en.md)

## 安装

```bash
pnpm add @xz-summer/milkdown-slash-menu-react
```

## 使用

```tsx
import { Editor } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { slashMenuPlugins, configureSlashMenu } from "@xz-summer/milkdown-slash-menu-react";
import "@xz-summer/milkdown-slash-menu-react/style.css";

const editor = await Editor.make()
  .use(commonmark)
  .use(slashMenuPlugins)
  .config((ctx) => {
    configureSlashMenu(ctx, {
      locale: "zh-CN",
    });
  })
  .create();
```

## 与 Crepe 一起使用

```tsx
import { Crepe } from "@milkdown/crepe";
import { slashMenuPlugins, configureSlashMenu } from "@xz-summer/milkdown-slash-menu-react";

const crepe = new Crepe({
  root,
  featureConfigs: {
    [Crepe.Feature.BlockEdit]: {
      textGroup: null,
      listGroup: null,
      advancedGroup: null,
    },
  },
});

crepe.editor
  .use(slashMenuPlugins)
  .config((ctx) => {
    configureSlashMenu(ctx);
  });
```

## 文档

完整文档请参阅 [@xz-summer/milkdown-slash-menu-core](https://www.npmjs.com/package/@xz-summer/milkdown-slash-menu-core)。

## License

MIT
