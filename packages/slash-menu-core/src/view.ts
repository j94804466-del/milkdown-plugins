import type { Ctx } from "@milkdown/kit/ctx";
import type { EditorView } from "@milkdown/kit/prose/view";

import { SlashProvider } from "@milkdown/kit/plugin/slash";
import { TextSelection, type Selection } from "@milkdown/kit/prose/state";
import { size, offset, type Placement, type Middleware } from "@floating-ui/dom";

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
  private lockedBottom: number | null = null;
  private lockedPlacement: 'top' | 'bottom' | null = null;

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
    
    // 浮动配置
    const floatingOffset = options.floating?.offset ?? 10;
    const floatingWidth = options.floating?.width ?? 260;
    const floatingMaxHeight = options.floating?.maxHeight ?? 440;
    const floatingMinHeight = options.floating?.minHeight ?? 100;
    const floatingPadding = options.floating?.padding ?? 10;
    const floatingPlacement: Placement = options.floating?.placement === "top" ? "top-start" : "bottom-start";

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
      // 挂载到 body，确保能正确检测视口边界
      root: document.body,
      // 通过 floatingUIOptions.middleware 完全替换中间件，移除默认的 flip()
      floatingUIOptions: {
        placement: floatingPlacement,
        middleware: [
          // 自定义 flip：只在首次决定方向，之后锁定
          {
            name: 'conditionalFlip',
            fn(state) {
              // 如果已经锁定了方向，直接返回锁定的 placement
              if (self.lockedPlacement !== null) {
                const lockedPlacementFull = self.lockedPlacement === 'top' ? 'top-start' : 'bottom-start';
                if (state.placement !== lockedPlacementFull) {
                  return { reset: { placement: lockedPlacementFull } };
                }
                return {};
              }
              
              // 首次：使用 flip 的逻辑检测空间
              const { rects } = state;
              const isTop = floatingPlacement.startsWith('top');
              
              // 获取视口信息
              const viewportHeight = window.innerHeight;
              const referenceTop = rects.reference.y;
              const referenceBottom = rects.reference.y + rects.reference.height;
              
              // 计算上下可用空间
              const spaceAbove = referenceTop - floatingPadding;
              const spaceBelow = viewportHeight - referenceBottom - floatingPadding;
              
              // 决定方向：优先使用配置的方向，空间不足时选择空间更大的一方
              let finalPlacement: 'top' | 'bottom';
              
              if (isTop) {
                // 配置为向上
                if (spaceAbove >= floatingMaxHeight) {
                  // 上方空间足够 maxHeight，使用上方
                  finalPlacement = 'top';
                } else if (spaceBelow > spaceAbove && spaceBelow >= floatingMinHeight) {
                  // 下方空间更大且足够 minHeight，翻转到下方
                  finalPlacement = 'bottom';
                } else {
                  // 否则使用上方
                  finalPlacement = 'top';
                }
              } else {
                // 配置为向下
                if (spaceBelow >= floatingMaxHeight) {
                  // 下方空间足够 maxHeight，使用下方
                  finalPlacement = 'bottom';
                } else if (spaceAbove > spaceBelow && spaceAbove >= floatingMinHeight) {
                  // 上方空间更大且足够 minHeight，翻转到上方
                  finalPlacement = 'top';
                } else {
                  // 否则使用下方
                  finalPlacement = 'bottom';
                }
              }
              
              // 锁定方向
              self.lockedPlacement = finalPlacement;
              
              const finalPlacementFull = finalPlacement === 'top' ? 'top-start' : 'bottom-start';
              if (state.placement !== finalPlacementFull) {
                return { reset: { placement: finalPlacementFull } };
              }
              return {};
            }
          } as Middleware,
          offset(floatingOffset),
          size({
            padding: floatingPadding,
            apply({ availableHeight, elements, placement }) {
              const menuEl = elements.floating.querySelector('.milkdown-slash-menu') as HTMLElement | null;
              if (!menuEl) return;
              
              // 设置宽度
              menuEl.style.width = `${floatingWidth}px`;
              
              // 计算高度
              const available = availableHeight - floatingPadding;
              const finalHeight = available >= floatingMaxHeight
                ? floatingMaxHeight
                : Math.max(available, floatingMinHeight);
              
              menuEl.style.maxHeight = `${finalHeight}px`;
              
              // 设置 data-placement
              const isTop = self.lockedPlacement === 'top';
              menuEl.dataset.placement = isTop ? 'top' : 'bottom';
              
              // 向上展开时，锁定底部位置
              if (isTop) {
                const container = elements.floating;
                
                requestAnimationFrame(() => {
                  const currentTop = parseFloat(container.style.top) || 0;
                  const currentHeight = container.offsetHeight;
                  
                  if (self.lockedBottom === null) {
                    self.lockedBottom = currentTop + currentHeight;
                  } else {
                    const newTop = self.lockedBottom - currentHeight;
                    container.style.top = `${newTop}px`;
                  }
                });
              }
            },
          }),
        ],
      },
    });

    this.slashProvider.onShow = () => {
      this.show = true;
      this.activeIndex = 0;
      this.options.onOpen?.();
      this.render();
    };

    this.slashProvider.onHide = () => {
      this.show = false;
      this.lockedBottom = null;
      this.lockedPlacement = null;
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

    let globalIndex = 0;
    const runtimeGroups: RuntimeMenuGroup[] = [];

    for (const group of allGroups) {
      const groupItems = registry.getItems(group.id);
      
      // 为每个菜单项附加分组信息，用于搜索
      const itemsWithGroup = groupItems.map((item) => ({
        ...item,
        _group: group,
      }));
      
      const filteredItems = customFilter(itemsWithGroup, this.filter);

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
