import type { 
  MenuState, 
  MenuCallbacks, 
  RuntimeMenuGroup, 
  RuntimeMenuItem,
  ItemRenderProps,
  GroupRenderProps,
  MenuRenderProps,
  MenuSlots,
} from "@xz-summer/milkdown-slash-menu-core";

import {
  CLASS_NAMES,
  DEFAULT_GRID_COLUMNS,
  getLayoutClassName,
  isIconOnlyLayout,
  expandIcon,
  collapseIcon,
  DEFAULT_UI_LABELS,
  type UILabels,
} from "@xz-summer/milkdown-slash-menu-core";

import { defineComponent, h, ref, computed, watch, nextTick, type PropType, type CSSProperties, type VNode } from "vue";

// ============ 快捷键提示配置 ============

interface ShortcutHint {
  key: string;
  labelKey: keyof UILabels;
}

// 所有快捷键
const ALL_SHORTCUTS: ShortcutHint[] = [
  { key: "↑↓", labelKey: "navigate" },
  { key: "Enter", labelKey: "select" },
  { key: "Esc", labelKey: "close" },
  { key: "Tab", labelKey: "switchGroup" },
  { key: "Home", labelKey: "firstItem" },
  { key: "End", labelKey: "lastItem" },
];

// 分为3组，每组2个，用于轮换显示
const SHORTCUT_GROUPS: ShortcutHint[][] = [
  ALL_SHORTCUTS.slice(0, 2),
  ALL_SHORTCUTS.slice(2, 4),
  ALL_SHORTCUTS.slice(4, 6),
];

const STORAGE_KEY = "milkdown-slash-menu-shortcut-index";

// ============ 默认快捷键提示 ============

const ShortcutHints = defineComponent({
  name: "ShortcutHints",
  props: {
    i18n: { type: Object as PropType<UILabels>, default: () => DEFAULT_UI_LABELS },
    menuShow: { type: Boolean, default: false },
    menuRef: { type: Object as PropType<{ value: HTMLElement | null }>, default: undefined },
    onExpand: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const expanded = ref(false);
    const rotationIndex = ref(0);

    // 监听菜单显示状态
    watch(() => props.menuShow, (show) => {
      if (show) {
        // 重置展开状态
        expanded.value = false;
        // 恢复菜单高度为 max-height 控制
        if (props.menuRef?.value) {
          props.menuRef.value.style.height = "";
        }
        // 读取上次索引
        const stored = localStorage.getItem(STORAGE_KEY);
        const lastIndex = stored ? parseInt(stored, 10) : 0;
        const nextIndex = (lastIndex + 1) % SHORTCUT_GROUPS.length;
        rotationIndex.value = nextIndex;
        // 保存新索引
        localStorage.setItem(STORAGE_KEY, String(nextIndex));
      }
    }, { immediate: true });

    const handleExpand = () => {
      // 展开前固定菜单高度
      if (props.menuRef?.value) {
        const currentHeight = props.menuRef.value.offsetHeight;
        props.menuRef.value.style.height = `${currentHeight}px`;
      }
      expanded.value = true;
      props.onExpand?.();
    };

    const handleCollapse = () => {
      expanded.value = false;
      // 收起后恢复菜单高度为 max-height 控制
      if (props.menuRef?.value) {
        props.menuRef.value.style.height = "";
      }
    };

    return () => {
      const currentShortcuts = SHORTCUT_GROUPS[rotationIndex.value] || SHORTCUT_GROUPS[0];

      if (expanded.value) {
        return h("div", { class: `${CLASS_NAMES.hints} expanded` }, [
          h("div", { class: CLASS_NAMES.hintsList },
            ALL_SHORTCUTS.map((shortcut, idx) =>
              h("div", { key: idx, class: CLASS_NAMES.hintsItem }, [
                h("kbd", {}, shortcut.key),
                h("span", {}, props.i18n[shortcut.labelKey]),
              ])
            )
          ),
          h("button", {
            class: CLASS_NAMES.hintsToggle,
            onClick: handleCollapse,
            title: props.i18n.collapse,
            innerHTML: collapseIcon,
          }),
        ]);
      }

      return h("div", { class: CLASS_NAMES.hints }, [
        ...currentShortcuts.map((shortcut, idx) =>
          h("span", { key: idx }, [h("kbd", {}, shortcut.key), ` ${props.i18n[shortcut.labelKey]}`])
        ),
        h("button", {
          class: CLASS_NAMES.hintsToggle,
          onClick: handleExpand,
          title: props.i18n.expand,
          innerHTML: expandIcon,
        }),
      ]);
    };
  },
});

// ============ 默认菜单项渲染 ============

export const DefaultMenuItem = defineComponent({
  name: "DefaultMenuItem",
  props: {
    item: { type: Object as PropType<RuntimeMenuItem>, required: true },
    isActive: { type: Boolean, required: true },
    iconOnly: { type: Boolean, required: true },
    onItemSelect: { type: Function as PropType<() => void>, required: true },
    onItemHover: { type: Function as PropType<(e: PointerEvent) => void>, required: true },
  },
  setup(props) {
    return () => h(
      "li",
      {
        id: `slash-menu-item-${props.item.id}`,
        role: "option",
        "aria-selected": props.isActive,
        "aria-disabled": props.item.disabled,
        "data-index": props.item.index,
        class: `${CLASS_NAMES.item} ${props.isActive ? CLASS_NAMES.itemActive : ""} ${props.item.disabled ? CLASS_NAMES.itemDisabled : ""}`,
        onPointerenter: props.onItemHover,
        onPointerup: () => !props.item.disabled && props.onItemSelect(),
        title: props.iconOnly ? props.item.label : undefined,
      },
      [
        props.item.icon && h("span", {
          class: CLASS_NAMES.itemIcon,
          innerHTML: props.item.icon,
          "aria-hidden": "true",
        }),
        !props.iconOnly && [
          h("span", { class: CLASS_NAMES.itemLabel }, props.item.label),
          props.item.description && h("span", { class: CLASS_NAMES.itemDesc }, props.item.description),
        ],
      ]
    );
  },
});


// ============ 菜单项渲染（支持自定义） ============

const MenuItemRenderer = defineComponent({
  name: "MenuItemRenderer",
  props: {
    item: { type: Object as PropType<RuntimeMenuItem>, required: true },
    isActive: { type: Boolean, required: true },
    iconOnly: { type: Boolean, required: true },
    onSelect: { type: Function as PropType<(index: number) => void>, required: true },
    onHover: { type: Function as PropType<(index: number, e: PointerEvent) => void>, required: true },
  },
  setup(props) {
    const handleSelect = () => props.onSelect(props.item.index);
    const handleHover = () => props.onHover(props.item.index, {} as PointerEvent);
    const handlePointerHover = (e: PointerEvent) => props.onHover(props.item.index, e);

    return () => {
      if (props.item.renderItem) {
        const renderProps: ItemRenderProps = {
          item: props.item,
          isActive: props.isActive,
          onSelect: handleSelect,
          onHover: handleHover,
        };
        return props.item.renderItem(renderProps) as VNode;
      }
      return h(DefaultMenuItem, {
        item: props.item,
        isActive: props.isActive,
        iconOnly: props.iconOnly,
        onItemSelect: handleSelect,
        onItemHover: handlePointerHover,
      });
    };
  },
});

// ============ 默认分组渲染 ============

export const DefaultMenuGroup = defineComponent({
  name: "DefaultMenuGroup",
  props: {
    group: { type: Object as PropType<RuntimeMenuGroup>, required: true },
    activeIndex: { type: Number, required: true },
    onSelect: { type: Function as PropType<(index: number) => void>, required: true },
    onHover: { type: Function as PropType<(index: number, e: PointerEvent) => void>, required: true },
  },
  setup(props) {
    const layoutClass = computed(() => getLayoutClassName(props.group.layout));
    const iconOnly = computed(() => isIconOnlyLayout(props.group.layout));
    const labelId = computed(() => `slash-menu-group-label-${props.group.id}`);
    const gridStyle = computed<CSSProperties | undefined>(() => {
      if (props.group.layout === "grid") {
        return { "--milkdown-slash-menu-grid-columns": props.group.columns ?? DEFAULT_GRID_COLUMNS } as CSSProperties;
      }
      return undefined;
    });

    return () => h(
      "div",
      { 
        class: `${CLASS_NAMES.group} ${layoutClass.value}`,
        role: "group",
        "aria-labelledby": labelId.value,
      },
      [
        h("div", { id: labelId.value, class: CLASS_NAMES.groupLabel }, props.group.label),
        h(
          "ul",
          { 
            class: CLASS_NAMES.groupItems, 
            style: gridStyle.value,
            role: "listbox",
          },
          props.group.items.map((item) =>
            h(MenuItemRenderer, {
              key: item.id,
              item,
              isActive: props.activeIndex === item.index,
              iconOnly: iconOnly.value,
              onSelect: props.onSelect,
              onHover: props.onHover,
            })
          )
        ),
      ]
    );
  },
});


// ============ 分组渲染（支持自定义） ============

const MenuGroupRenderer = defineComponent({
  name: "MenuGroupRenderer",
  props: {
    group: { type: Object as PropType<RuntimeMenuGroup>, required: true },
    activeIndex: { type: Number, required: true },
    onSelect: { type: Function as PropType<(index: number) => void>, required: true },
    onHover: { type: Function as PropType<(index: number, e: PointerEvent) => void>, required: true },
  },
  setup(props) {
    return () => {
      if (props.group.renderGroup) {
        const renderProps: GroupRenderProps = {
          group: props.group,
          activeIndex: props.activeIndex,
          onSelect: props.onSelect,
          onHover: (index) => props.onHover(index, {} as PointerEvent),
          defaultRender: () => h(DefaultMenuGroup, {
            group: props.group,
            activeIndex: props.activeIndex,
            onSelect: props.onSelect,
            onHover: props.onHover,
          }),
        };
        return props.group.renderGroup(renderProps) as VNode;
      }
      return h(DefaultMenuGroup, {
        group: props.group,
        activeIndex: props.activeIndex,
        onSelect: props.onSelect,
        onHover: props.onHover,
      });
    };
  },
});

// ============ 默认菜单渲染 ============

export const DefaultSlashMenu = defineComponent({
  name: "DefaultSlashMenu",
  props: {
    state: { type: Object as PropType<MenuState>, required: true },
    callbacks: { type: Object as PropType<MenuCallbacks>, required: true },
    slots: { type: Object as PropType<MenuSlots>, default: undefined },
    showShortcutHints: { type: Boolean, default: true },
    i18n: { type: Object as PropType<UILabels>, default: () => DEFAULT_UI_LABELS },
  },
  setup(props) {
    const menuRef = ref<HTMLDivElement | null>(null);
    const scrollRef = ref<HTMLDivElement | null>(null);
    const tabsRef = ref<HTMLElement | null>(null);
    const prevMousePos = ref({ x: -999, y: -999 });

    const activeGroupId = computed(() => {
      for (const group of props.state.groups) {
        if (props.state.activeIndex >= group.range[0] && props.state.activeIndex < group.range[1]) {
          return group.id;
        }
      }
      return props.state.groups[0]?.id;
    });

    watch(activeGroupId, (groupId) => {
      if (!tabsRef.value || !groupId) return;
      const activeTab = tabsRef.value.querySelector<HTMLElement>(`[data-group-id="${groupId}"]`);
      if (!activeTab) return;
      const tabsRect = tabsRef.value.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();
      if (tabRect.left < tabsRect.left) {
        tabsRef.value.scrollLeft -= tabsRect.left - tabRect.left + 10;
      } else if (tabRect.right > tabsRect.right) {
        tabsRef.value.scrollLeft += tabRect.right - tabsRect.right + 10;
      }
    });

    watch(() => props.state.activeIndex, (index) => {
      if (!scrollRef.value) return;
      
      // 如果是第一个菜单项，直接滚动到顶部
      if (index === 0) {
        scrollRef.value.scrollTop = 0;
        return;
      }
      
      // 如果是最后一个菜单项，直接滚动到底部
      if (index === props.state.totalCount - 1) {
        scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
        return;
      }
      
      const target = scrollRef.value.querySelector<HTMLElement>(`[data-index="${index}"]`);
      if (!target) return;

      // 检查是否是分组的第一个项
      const currentGroup = props.state.groups.find(
        (g) => index >= g.range[0] && index < g.range[1]
      );
      const isFirstInGroup = currentGroup && index === currentGroup.range[0];

      if (isFirstInGroup) {
        // 如果是分组第一项，滚动到分组容器（包含标签）
        const groupEl = target.closest(`.${CLASS_NAMES.group}`);
        groupEl?.scrollIntoView({ block: "nearest" });
      } else {
        target.scrollIntoView({ block: "nearest" });
      }
    });

    const handleTabClick = (groupId: string) => {
      const group = props.state.groups.find((g) => g.id === groupId);
      if (group) props.callbacks.onHover(group.range[0]);
    };

    const handlePointerMove = (e: PointerEvent) => {
      prevMousePos.value = { x: e.clientX, y: e.clientY };
    };

    const handleItemHover = (index: number, e: PointerEvent) => {
      const { x, y } = prevMousePos.value;
      if (e.clientX !== x || e.clientY !== y) {
        props.callbacks.onHover(index);
      }
    };

    return () => {
      const { groups, activeIndex, show, totalCount } = props.state;
      const { onSelect } = props.callbacks;
      const slots = props.slots;
      const i18n = props.i18n;

      if (totalCount === 0) {
        return h("div", { 
          class: CLASS_NAMES.menu, 
          "data-show": show,
          role: "dialog",
          "aria-label": "Slash menu",
        },
          slots?.empty ? (slots.empty() as VNode) : h("div", { class: CLASS_NAMES.empty, role: "status" }, i18n.noResults)
        );
      }

      return h("div", { 
        ref: menuRef,
        class: CLASS_NAMES.menu, 
        "data-show": show, 
        onPointermove: handlePointerMove,
        role: "dialog",
        "aria-label": "Slash menu",
      }, [
        // beforeHeader 插槽
        slots?.beforeHeader && (slots.beforeHeader() as VNode),
        // tabs (header)
        h("nav", { ref: tabsRef, class: CLASS_NAMES.tabs, "aria-label": "Menu groups" },
          h("ul", { role: "tablist" }, groups.map((group) =>
            h("li", {
              key: group.id,
              role: "tab",
              "aria-selected": activeGroupId.value === group.id,
              "aria-controls": `slash-menu-group-${group.id}`,
              "data-group-id": group.id,
              class: { active: activeGroupId.value === group.id },
              onPointerdown: () => handleTabClick(group.id),
            }, group.label)
          ))
        ),
        // afterHeader 插槽
        slots?.afterHeader && (slots.afterHeader() as VNode),
        // body (滚动区域)
        h("div", { ref: scrollRef, class: CLASS_NAMES.body }, [
          // beforeContent 插槽
          slots?.beforeContent && (slots.beforeContent() as VNode),
          // content
          h("div", { class: CLASS_NAMES.content },
            groups.map((group) => h(MenuGroupRenderer, {
              key: group.id, group, activeIndex, onSelect, onHover: handleItemHover,
            }))
          ),
          // afterContent 插槽
          slots?.afterContent && (slots.afterContent() as VNode),
          // 快捷键提示 (内部组件，在 body 内部，sticky 定位)
          props.showShortcutHints && h(ShortcutHints, { 
            i18n, 
            menuShow: show,
            menuRef: menuRef,
            onExpand: () => {
              nextTick(() => {
                if (scrollRef.value) {
                  scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
                }
              });
            },
          }),
        ]),
        // beforeFooter 插槽
        slots?.beforeFooter && (slots.beforeFooter() as VNode),
        // footer 插槽
        slots?.footer && (slots.footer() as VNode),
        // afterFooter 插槽
        slots?.afterFooter && (slots.afterFooter() as VNode),
      ]);
    };
  },
});


// ============ 主组件（支持三层自定义） ============

export const SlashMenu = defineComponent({
  name: "SlashMenu",
  props: {
    state: { type: Object as PropType<MenuState>, required: true },
    callbacks: { type: Object as PropType<MenuCallbacks>, required: true },
    slots: { type: Object as PropType<MenuSlots>, default: undefined },
    showShortcutHints: { type: Boolean, default: true },
    i18n: { type: Object as PropType<UILabels>, default: () => DEFAULT_UI_LABELS },
    renderMenu: { type: Function as PropType<(props: MenuRenderProps) => unknown>, default: undefined },
  },
  setup(props) {
    return () => {
      if (props.renderMenu) {
        const renderProps: MenuRenderProps = {
          state: props.state,
          callbacks: props.callbacks,
          slots: props.slots,
          defaultRender: () => h(DefaultSlashMenu, {
            state: props.state,
            callbacks: props.callbacks,
            slots: props.slots,
            showShortcutHints: props.showShortcutHints,
            i18n: props.i18n,
          }),
        };
        return props.renderMenu(renderProps) as VNode;
      }
      return h(DefaultSlashMenu, {
        state: props.state,
        callbacks: props.callbacks,
        slots: props.slots,
        showShortcutHints: props.showShortcutHints,
        i18n: props.i18n,
      });
    };
  },
});
