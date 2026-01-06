import type { SlashMenuRenderer, MenuState, MenuCallbacks, MenuRenderProps, MenuSlots } from "@xz-summer/milkdown-slash-menu-core";
import type { UILabels } from "@xz-summer/milkdown-slash-menu-core";

import { createRoot, type Root } from "react-dom/client";

import { SlashMenu } from "./SlashMenu";

export interface ReactRendererOptions {
  /** 自定义整体菜单渲染 */
  renderMenu?: (props: MenuRenderProps) => React.ReactNode;
  /** 菜单插槽 */
  slots?: MenuSlots;
  /** 是否显示快捷键提示，默认 true */
  showShortcutHints?: boolean;
  /** 国际化标签 */
  i18n?: UILabels;
}

export function createReactRenderer(options: ReactRendererOptions = {}): SlashMenuRenderer {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  return {
    mount(el) {
      container = el;
      root = createRoot(el);
    },

    update(state: MenuState, callbacks: MenuCallbacks) {
      if (!container) return;

      container.setAttribute("data-show", String(state.show));

      if (root) {
        root.render(
          <SlashMenu 
            state={state} 
            callbacks={callbacks} 
            slots={options.slots}
            showShortcutHints={options.showShortcutHints}
            i18n={options.i18n}
            renderMenu={options.renderMenu}
          />
        );
      }
    },

    unmount() {
      root?.unmount();
      root = null;
      container = null;
    },
  };
}
