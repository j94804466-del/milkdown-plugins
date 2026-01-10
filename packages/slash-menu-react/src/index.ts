import type { Ctx, MilkdownPlugin } from "@milkdown/kit/ctx";

import {
  slashMenuPlugin as coreSlashMenuPlugin,
  configureSlashMenu as coreConfigureSlashMenu,
  getUILabels,
  slashMenu,
  type ConfigureSlashMenuOptions,
  type MenuRenderProps,
  type MenuSlots,
  type SlashMenuI18n,
} from "@xz-summer/milkdown-slash-menu-core";
import { useCallback } from "react";

import { createReactRenderer, type ReactRendererOptions } from "./renderer";

// Re-export everything from core (except slashMenuPlugin which we override)
export {
  slashMenu,
  slashMenuAPI,
  menuRegistryCtx,
  configureSlashMenu as coreConfigureSlashMenu,
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
  ConfigureSlashMenuOptions,
  LayoutType,
} from "@xz-summer/milkdown-slash-menu-core";

// Export React-specific
export { createReactRenderer, type ReactRendererOptions } from "./renderer";
export { 
  SlashMenu,
  DefaultSlashMenu,
  DefaultMenuGroup,
  DefaultMenuItem,
  type SlashMenuProps,
  type DefaultSlashMenuProps,
  type DefaultMenuGroupProps,
  type DefaultMenuItemProps,
} from "./SlashMenu";

// ============ React 配置选项 ============

export interface ReactSlashMenuOptions extends Omit<ConfigureSlashMenuOptions, "renderer" | "renderMenu" | "slots"> {
  /** 自定义整体菜单渲染 */
  renderMenu?: (props: MenuRenderProps) => React.ReactNode;
  /** 菜单插槽（React 版本） */
  slots?: {
    header?: () => React.ReactNode;
    footer?: () => React.ReactNode;
    beforeTabs?: () => React.ReactNode;
    afterTabs?: () => React.ReactNode;
    empty?: () => React.ReactNode;
  };
  /** 是否显示快捷键提示，默认 true */
  showShortcutHints?: boolean;
  /** i18n 配置 */
  i18n?: SlashMenuI18n;
}

// ============ 带默认渲染器的插件 ============

// 标记是否已配置
let isConfigured = false;

/**
 * 配置斜杠菜单（React 版本）
 * 如果不调用此函数，插件会使用默认配置
 */
export function configureSlashMenu(
  ctx: Ctx,
  options: ReactSlashMenuOptions = {}
) {
  isConfigured = true;
  const { renderMenu, slots, showShortcutHints, locale = "zh-CN", i18n, ...coreOptions } = options;
  
  // 获取 UI 标签
  const uiLabels = getUILabels(locale, i18n);
  
  coreConfigureSlashMenu(ctx, {
    ...coreOptions,
    locale,
    i18n,
    renderer: () => createReactRenderer({ 
      renderMenu, 
      slots: slots as MenuSlots,
      showShortcutHints,
      i18n: uiLabels,
    }),
  });
}

/**
 * 默认配置函数，在插件初始化时自动调用
 */
function applyDefaultConfig(ctx: Ctx) {
  if (isConfigured) return;
  
  const uiLabels = getUILabels("zh-CN");
  
  coreConfigureSlashMenu(ctx, {
    locale: "zh-CN",
    renderer: () => createReactRenderer({
      i18n: uiLabels,
    }),
  });
}

/**
 * 自动配置插件
 */
const autoConfigPlugin: MilkdownPlugin = (ctx) => () => {
  applyDefaultConfig(ctx);
};

/**
 * 斜杠菜单插件（React 版本）
 * 开箱即用，无需手动调用 configureSlashMenu
 */
export const slashMenuPlugin: MilkdownPlugin[] = [
  autoConfigPlugin,
  ...coreSlashMenuPlugin,
];

// ============ React Hook ============

export function useSlashMenu(
  options: ReactSlashMenuOptions = {}
): {
  plugins: MilkdownPlugin[];
  configure: (ctx: Ctx) => void;
} {
  const configure = useCallback(
    (ctx: Ctx) => {
      configureSlashMenu(ctx, options);
    },
    [options]
  );

  return {
    plugins: coreSlashMenuPlugin,
    configure,
  };
}
