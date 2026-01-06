import type { SlashMenuRenderer, MenuState, MenuCallbacks, MenuRenderProps, MenuSlots } from "@xz-summer/milkdown-slash-menu-core";
import type { UILabels } from "@xz-summer/milkdown-slash-menu-core";
import { createApp, h, ref, type App } from "vue";

import { SlashMenu } from "./SlashMenu";

export interface VueRendererOptions {
  /** 自定义整体菜单渲染 */
  renderMenu?: (props: MenuRenderProps) => unknown;
  /** 菜单插槽 */
  slots?: MenuSlots;
  /** 是否显示快捷键提示，默认 true */
  showShortcutHints?: boolean;
  /** 国际化标签 */
  i18n?: UILabels;
}

export function createVueRenderer(options: VueRendererOptions = {}): SlashMenuRenderer {
  let app: App | null = null;
  let container: HTMLElement | null = null;

  const state = ref<MenuState>({
    groups: [],
    activeIndex: 0,
    filter: "",
    totalCount: 0,
    show: false,
  });

  const callbacks = ref<MenuCallbacks>({
    onSelect: () => {},
    onHover: () => {},
    onClose: () => {},
  });

  return {
    mount(el) {
      container = el;
      app = createApp({
        setup() {
          return () => h(SlashMenu, { 
            state: state.value, 
            callbacks: callbacks.value,
            slots: options.slots,
            showShortcutHints: options.showShortcutHints,
            i18n: options.i18n,
            renderMenu: options.renderMenu,
          });
        },
      });
      app.mount(el);
    },

    update(newState: MenuState, newCallbacks: MenuCallbacks) {
      if (!container) return;
      container.setAttribute("data-show", String(newState.show));
      state.value = newState;
      callbacks.value = newCallbacks;
    },

    unmount() {
      app?.unmount();
      app = null;
      container = null;
    },
  };
}
