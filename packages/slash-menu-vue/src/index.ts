import type { MilkdownPlugin } from "@milkdown/kit/ctx";
import type { VNode } from "vue";

import {
  slashMenuPluginWithAutoInit,
  slashMenuConfig,
  getUILabels,
  type MenuRenderProps,
  type MenuSlots,
} from "@xz-summer/milkdown-slash-menu-core";

import { createVueRenderer, type VueRendererOptions } from "./renderer";

// Re-export everything from core
export {
  slashMenu,
  slashMenuAPI,
  menuRegistryCtx,
  getUILabels,
  getLocaleConfig,
  getDefaultMenuGroups,
  filterAndSort,
  CLASS_NAMES,
  DEFAULT_GROUP_IDS,
  DEFAULT_ITEM_IDS,
  LAYOUT_TYPES,
  DEFAULT_GRID_COLUMNS,
  DEFAULT_UI_LABELS,
  BUILTIN_LOCALES,
  getLayoutClassName,
  isIconOnlyLayout,
  // 配置 API
  slashMenuConfig,
  mergeSlashMenuConfig,
} from "@xz-summer/milkdown-slash-menu-core";

export type {
  SlashMenuOptions,
  SlashMenuRenderer,
  MenuState,
  MenuCallbacks,
  MenuGroup,
  MenuGroupConfig,
  MenuItem,
  MenuItemConfig,
  RuntimeMenuGroup,
  RuntimeMenuItem,
  MenuRenderProps,
  GroupRenderProps,
  ItemRenderProps,
  MenuSlots,
  FloatingOptions,
  MenuRegistry,
  DefaultMenuOptions,
  LocaleConfig,
  LocaleType,
  ItemI18n,
  SlashMenuI18n,
  UILabels,
  LayoutType,
  SlashMenuConfig,
  Position,
} from "@xz-summer/milkdown-slash-menu-core";

// Export Vue-specific
export { createVueRenderer, type VueRendererOptions } from "./renderer";
export { 
  SlashMenu,
  DefaultSlashMenu,
  DefaultMenuGroup,
  DefaultMenuItem,
} from "./SlashMenu";

// ============ Vue 配置选项 ============

export interface VueSlashMenuOptions {
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
}

// ============ 设置 Vue 渲染器的插件 ============

/**
 * 设置 Vue 渲染器
 * 在插件初始化时设置 rendererFactory
 */
const setVueRendererPlugin: MilkdownPlugin = (ctx) => () => {
  ctx.update(slashMenuConfig.key, (prev) => ({
    ...prev,
    rendererFactory: () => {
      const uiLabels = getUILabels(prev.locale, prev.i18n);
      return createVueRenderer({
        showShortcutHints: prev.pluginOptions.showShortcutHints,
        i18n: uiLabels,
      });
    },
  }));
};

/**
 * 斜杠菜单插件（Vue 版本）
 * 开箱即用，自动读取 slashMenuConfig 配置
 * 
 * @example
 * ```ts
 * editor
 *   .use(slashMenuPlugin)
 *   .config((ctx) => {
 *     // 可选：自定义配置
 *     ctx.update(slashMenuConfig.key, mergeSlashMenuConfig({
 *       locale: 'en',
 *       groups: [
 *         { id: 'basic', layout: 'list' }
 *       ]
 *     }))
 *   })
 *   .create()
 * ```
 */
export const slashMenuPlugin: MilkdownPlugin[] = [
  setVueRendererPlugin,
  ...slashMenuPluginWithAutoInit,
];

// ============ Vue Composable ============

export function useSlashMenu(
  options: VueSlashMenuOptions = {}
): {
  plugins: MilkdownPlugin[];
} {
  const customSetRendererPlugin: MilkdownPlugin = (ctx) => () => {
    ctx.update(slashMenuConfig.key, (prev) => ({
      ...prev,
      rendererFactory: () => {
        const uiLabels = getUILabels(prev.locale, prev.i18n);
        return createVueRenderer({
          renderMenu: options.renderMenu,
          slots: options.slots as MenuSlots,
          showShortcutHints: options.showShortcutHints ?? prev.pluginOptions.showShortcutHints,
          i18n: uiLabels,
        });
      },
    }));
  };

  return {
    plugins: [customSetRendererPlugin, ...slashMenuPluginWithAutoInit],
  };
}
