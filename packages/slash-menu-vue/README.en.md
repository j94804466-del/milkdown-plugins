# @xz-summer/milkdown-slash-menu-vue

Vue renderer for [Milkdown](https://milkdown.dev) slash menu plugin.

> 📖 [中文文档](./README.md)

## Installation

```bash
pnpm add @xz-summer/milkdown-slash-menu-vue
```

## Usage

```vue
<script setup lang="ts">
import { Milkdown, useEditor } from "@milkdown/vue";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { slashMenuPlugins, configureSlashMenu } from "@xz-summer/milkdown-slash-menu-vue";
import "@xz-summer/milkdown-slash-menu-vue/style.css";

useEditor((root) => {
  return Editor.make()
    .use(commonmark)
    .use(slashMenuPlugins)
    .config((ctx) => {
      configureSlashMenu(ctx, {
        locale: "en",
      });
    });
});
</script>

<template>
  <Milkdown />
</template>
```

## With Crepe

```vue
<script setup lang="ts">
import { Crepe } from "@milkdown/crepe";
import { Milkdown, useEditor } from "@milkdown/vue";
import { slashMenuPlugins, configureSlashMenu } from "@xz-summer/milkdown-slash-menu-vue";

useEditor((root) => {
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

  return crepe;
});
</script>

<template>
  <Milkdown />
</template>
```

## Documentation

For full documentation, see [@xz-summer/milkdown-slash-menu-core](https://www.npmjs.com/package/@xz-summer/milkdown-slash-menu-core).

## License

MIT
