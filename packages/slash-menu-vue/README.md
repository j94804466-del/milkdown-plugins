# @xz-summer/milkdown-slash-menu-vue

Vue 渲染器，用于 [Milkdown](https://milkdown.dev) 斜杠菜单插件。

> 📖 [English Documentation](./README.en.md)

## 安装

```bash
pnpm add @xz-summer/milkdown-slash-menu-vue
```

## 使用

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
        locale: "zh-CN",
      });
    });
});
</script>

<template>
  <Milkdown />
</template>
```

## 与 Crepe 一起使用

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
      configureSlashMenu(ctx);
    });

  return crepe;
});
</script>

<template>
  <Milkdown />
</template>
```

## 文档

完整文档请参阅 [@xz-summer/milkdown-slash-menu-core](https://www.npmjs.com/package/@xz-summer/milkdown-slash-menu-core)。

## License

MIT
