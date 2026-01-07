import type { Ctx, MilkdownPlugin } from "@milkdown/kit/ctx";
import type { VNode } from "vue";

import {
  slashMenuPlugins,
  configureSlashMenu as coreConfigureSlashMenu,
  getUILabels,
  type ConfigureSlashMenuOptions,
  type MenuRenderProps,
  type MenuSlots,
  type SlashMenuI18n,
} from "@xz-summer/milkdown-slash-menu-core";

import { createVueRenderer, type VueRendererOptions } from "./renderer";

// Re-export everything from core
export * from "@xz-summer/milkdown-slash-menu-core";

// Export Vue-specific
export { createVueRenderer, type VueRendererOptions } from "./renderer";
export { 
  SlashMenu,
  DefaultSlashMenu,
  DefaultMenuGroup,
  DefaultMenuItem,
} from "./SlashMenu";

// ============ Vue 配置选项 ============

export interface VueSlashMenuOptions extends Omit<ConfigureSlashMenuOptions, "renderer" | "renderMenu" | "slots"> {
  /** 自定义整体菜单渲染 */
  renderMenu?: (props: MenuRenderProps) => VNode;
  /** 菜单插槽（Vue 版本） */
  slots?: {
    header?: () => VNode;
    footer?: () => VNode;
    beforeTabs?: () => VNode;
    afterTabs?: () => VNode;
    empty?: () => VNode;
  };
  /** 是否显示快捷键提示，默认 true */
  showShortcutHints?: boolean;
  /** i18n 配置 */
  i18n?: SlashMenuI18n;
}

// ============ 便捷配置函数 ============

export function configureSlashMenu(
  ctx: Ctx,
  options: VueSlashMenuOptions = {}
) {
  const { renderMenu, slots, showShortcutHints, locale = "zh-CN", i18n, ...coreOptions } = options;
  
  // 获取 UI 标签
  const uiLabels = getUILabels(locale, i18n);
  
  coreConfigureSlashMenu(ctx, {
    ...coreOptions,
    locale,
    i18n,
    renderer: () => createVueRenderer({ 
      renderMenu, 
      slots: slots as MenuSlots,
      showShortcutHints,
      i18n: uiLabels,
    }),
  });
}

// ============ Vue Composable ============

export function useSlashMenu(
  options: VueSlashMenuOptions = {}
): {
  plugins: MilkdownPlugin[];
  configure: (ctx: Ctx) => void;
} {
  const configure = (ctx: Ctx) => {
    configureSlashMenu(ctx, options);
  };

  return {
    plugins: slashMenuPlugins,
    configure,
  };
}
