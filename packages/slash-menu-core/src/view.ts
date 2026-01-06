import type { Ctx } from "@milkdown/kit/ctx";
import type { EditorView } from "@milkdown/kit/prose/view";

import { SlashProvider } from "@milkdown/kit/plugin/slash";
import { TextSelection, type Selection } from "@milkdown/kit/prose/state";

import type { SlashMenuOptions, RuntimeMenuGroup, RuntimeMenuItem, SlashMenuRenderer, MenuState, MenuCallbacks } from "./types";

import { CLASS_NAMES } from "./constants";
import { filterAndSort } from "./filter";
import { menuRegistryCtx } from "./registry";

function isInCodeBlock(selection: Selection): boolean {
  return selection.$from.parent.type.name === "code_block";
}

function isInList(selection: Selection): boolean {
  return selection.$from.node(selection.$from.depth - 1)?.type?.name === "list_item";
}

function isAtEndOfNode(selection: Selection): boolean {
  if (!(selection instanceof TextSelection)) return false;
  const { $head } = selection;
  return $head.parentOffset === $head.parent.content.size;
}

export class SlashMenuView {
  private readonly container: HTMLElement;
  private readonly ctx: Ctx;
  private readonly options: SlashMenuOptions;
  private readonly renderer: SlashMenuRenderer;
  private slashProvider: SlashProvider;
  private programmaticallyPos: number | null = null;
  private filter = "";
  private show = false;
  private activeIndex = 0;

  constructor(ctx: Ctx, view: EditorView, options: SlashMenuOptions) {
    this.ctx = ctx;
    this.options = options;

    this.container = document.createElement("div");
    this.container.classList.add(CLASS_NAMES.container);

    if (!options.renderer) {
      throw new Error("SlashMenuOptions.renderer is required");
    }
    this.renderer = options.renderer();
    this.renderer.mount(this.container);

    const self = this;
    const trigger = options.trigger ?? "/";
    const positionOffset = options.position?.offset ?? 10;

    this.slashProvider = new SlashProvider({
      content: this.container,
      debounce: 20,
      shouldShow(this: SlashProvider, view: EditorView) {
        if (isInCodeBlock(view.state.selection) || isInList(view.state.selection)) {
          return false;
        }

        const text = this.getContent(view, (node) =>
          ["paragraph", "heading"].includes(node.type.name)
        );

        if (text == null || !isAtEndOfNode(view.state.selection)) {
          return false;
        }

        self.filter = text.startsWith(trigger) ? text.slice(trigger.length) : text;

        if (typeof self.programmaticallyPos === "number") {
          const maxSize = view.state.doc.nodeSize - 2;
          const validPos = Math.min(self.programmaticallyPos, maxSize);
          if (view.state.doc.resolve(validPos).node() !== view.state.doc.resolve(view.state.selection.from).node()) {
            self.programmaticallyPos = null;
            return false;
          }
          return true;
        }

        return text.startsWith(trigger);
      },
      offset: positionOffset,
      // 挂载到 body，确保 flip() 能正确检测视口边界
      root: document.body,
    });

    this.slashProvider.onShow = () => {
      this.show = true;
      this.activeIndex = 0;
      this.options.onOpen?.();
      this.render();
    };

    this.slashProvider.onHide = () => {
      this.show = false;
      this.options.onClose?.();
      this.render();
    };

    this.setupKeyboardNavigation();
    this.render();
    this.update(view);
  }

  private buildRuntimeGroups(): { groups: RuntimeMenuGroup[]; totalCount: number } {
    const registry = this.ctx.get(menuRegistryCtx.key);
    const allGroups = registry.getGroups();
    const customFilter = this.options.filter ?? filterAndSort;
    const filterLower = this.filter.toLowerCase();

    let globalIndex = 0;
    const runtimeGroups: RuntimeMenuGroup[] = [];

    for (const group of allGroups) {
      const groupItems = registry.getItems(group.id);
      const groupMatches = this.filter && group.label.toLowerCase().includes(filterLower);
      const filteredItems = groupMatches ? groupItems : customFilter(groupItems, this.filter);

      if (filteredItems.length === 0) continue;

      const startIndex = globalIndex;
      const runtimeItems: RuntimeMenuItem[] = filteredItems.map((item) => ({
        ...item,
        index: globalIndex++,
      }));

      runtimeGroups.push({
        ...group,
        items: runtimeItems,
        range: [startIndex, globalIndex],
      });
    }

    return { groups: runtimeGroups, totalCount: globalIndex };
  }

  private render() {
    const { groups, totalCount } = this.buildRuntimeGroups();

    // 调用 onFilter 钩子
    if (this.show) {
      const allItems = groups.flatMap((g) => g.items);
      this.options.onFilter?.(this.filter, allItems);
    }

    if (totalCount === 0 && this.show) {
      this.hideMenu();
      return;
    }

    if (this.activeIndex >= totalCount && totalCount > 0) {
      this.activeIndex = 0;
    }

    const state: MenuState = {
      groups,
      activeIndex: this.activeIndex,
      filter: this.filter,
      totalCount,
      show: this.show,
    };

    const callbacks: MenuCallbacks = {
      onSelect: (index) => this.runByIndex(index),
      onHover: (index) => {
        this.activeIndex = index;
        this.render();
      },
      onClose: () => this.hideMenu(),
    };

    this.renderer.update(state, callbacks);
  }

  private runByIndex(index: number) {
    const { groups } = this.buildRuntimeGroups();
    const allItems = groups.flatMap((g) => g.items);
    const item = allItems.find((i) => i.index === index);
    if (item && !item.disabled) {
      this.options.onSelect?.(item);
      item.action(this.ctx);
    }
    this.hideMenu();
  }

  private setupKeyboardNavigation() {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!this.show) return;

      const { groups, totalCount } = this.buildRuntimeGroups();

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          this.hideMenu();
          break;

        case "ArrowDown":
          e.preventDefault();
          if (this.activeIndex < totalCount - 1) {
            this.activeIndex++;
            this.render();
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (this.activeIndex > 0) {
            this.activeIndex--;
            this.render();
          }
          break;

        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault();
          const currentGroup = groups.find(
            (g) => g.range[0] <= this.activeIndex && g.range[1] > this.activeIndex
          );
          if (!currentGroup) break;

          const groupIndex = groups.indexOf(currentGroup);
          const targetGroup = e.key === "ArrowLeft" 
            ? groups[groupIndex - 1] 
            : groups[groupIndex + 1];
          
          if (targetGroup) {
            this.activeIndex = e.key === "ArrowLeft" 
              ? targetGroup.range[1] - 1 
              : targetGroup.range[0];
            this.render();
          }
          break;
        }

        case "Tab": {
          e.preventDefault();
          const currentGroup = groups.find(
            (g) => g.range[0] <= this.activeIndex && g.range[1] > this.activeIndex
          );
          if (!currentGroup) break;

          const groupIndex = groups.indexOf(currentGroup);
          // Shift+Tab 向前，Tab 向后
          const targetGroup = e.shiftKey
            ? groups[groupIndex - 1] ?? groups[groups.length - 1]  // 循环到最后
            : groups[groupIndex + 1] ?? groups[0];  // 循环到第一个
          
          if (targetGroup) {
            this.activeIndex = targetGroup.range[0];
            this.render();
          }
          break;
        }

        case "Home":
          e.preventDefault();
          if (totalCount > 0) {
            this.activeIndex = 0;
            this.render();
          }
          break;

        case "End":
          e.preventDefault();
          if (totalCount > 0) {
            this.activeIndex = totalCount - 1;
            this.render();
          }
          break;

        case "Enter":
          e.preventDefault();
          this.runByIndex(this.activeIndex);
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown, { capture: true });
  }

  update = (view: EditorView) => {
    this.slashProvider.update(view);
    if (this.show) {
      this.render();
    }
  };

  showMenu = (pos: number) => {
    this.programmaticallyPos = pos;
    this.filter = "";
    this.slashProvider.show();
  };

  hideMenu = () => {
    this.programmaticallyPos = null;
    this.slashProvider.hide();
  };

  destroy = () => {
    this.slashProvider.destroy();
    this.renderer.unmount();
    this.container.remove();
  };
}
