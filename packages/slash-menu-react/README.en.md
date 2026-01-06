# @xz-summer/milkdown-slash-menu-react

React renderer for [Milkdown](https://milkdown.dev) slash menu plugin.

> 📖 [中文文档](./README.md)

## Installation

```bash
pnpm add @xz-summer/milkdown-slash-menu-react
```

## Usage

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
      locale: "en",
    });
  })
  .create();
```

## With Crepe

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
    configureSlashMenu(ctx, { locale: "en" });
  });
```

## Documentation

For full documentation, see [@xz-summer/milkdown-slash-menu-core](https://www.npmjs.com/package/@xz-summer/milkdown-slash-menu-core).

## License

MIT
