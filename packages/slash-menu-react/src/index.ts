import type { Ctx, MilkdownPlugin } from "@milkdown/kit/ctx";

import {
  slashMenuPlugins,
  configureSlashMenu as coreConfigureSlashMenu,
  getUILabels,
  type ConfigureSlashMenuOptions,
  type MenuRenderProps,
  type MenuSlots,
  type SlashMenuI18n,
} from "@xz-summer/milkdown-slash-menu-core";
import { useCallback } from "react";

import { createReactRenderer, type ReactRendererOptions } from "./renderer";

// Re-export everything from core
export * from "@xz-summer/milkdown-slash-menu-core";

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

// ============ 便捷配置函数 ============

export function configureSlashMenu(
  ctx: Ctx,
  options: ReactSlashMenuOptions = {}
) {
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
    plugins: slashMenuPlugins,
    configure,
  };
}
