// ============ 布局相关常量 ============

/** 布局类型 */
export type LayoutType = "list" | "grid" | "icon-grid";

/** 布局类型常量 */
export const LAYOUT_TYPES = {
  /** 列表布局（默认） */
  LIST: "list",
  /** 网格布局 */
  GRID: "grid",
  /** 纯图标网格布局 */
  ICON_GRID: "icon-grid",
} as const satisfies Record<string, LayoutType>;

/** CSS 类名常量 */
export const CLASS_NAMES = {
  // 容器
  container: "milkdown-slash-menu-container",
  menu: "milkdown-slash-menu",

  // 标签栏
  tabs: "milkdown-slash-menu-tabs",

  // 滚动区域（包含 content 和 footer）
  body: "milkdown-slash-menu-body",

  // 内容区
  content: "milkdown-slash-menu-content",
  empty: "milkdown-slash-menu-empty",

  // 分组
  group: "milkdown-slash-menu-group",
  groupList: "milkdown-slash-menu-group-list",
  groupGrid: "milkdown-slash-menu-group-grid",
  groupIconGrid: "milkdown-slash-menu-group-icon-grid",
  groupLabel: "milkdown-slash-menu-group-label",
  groupItems: "milkdown-slash-menu-group-items",

  // 菜单项
  item: "milkdown-slash-menu-item",
  itemActive: "active",
  itemDisabled: "disabled",
  itemIcon: "milkdown-slash-menu-item-icon",
  itemContent: "milkdown-slash-menu-item-content",
  itemLabel: "milkdown-slash-menu-item-label",
  itemDesc: "milkdown-slash-menu-item-desc",

  // 快捷键提示
  hints: "milkdown-slash-menu-hints",
  hintsToggle: "milkdown-slash-menu-hints-toggle",
  hintsList: "milkdown-slash-menu-hints-list",
  hintsItem: "milkdown-slash-menu-hints-item",
} as const;

/** Grid 布局默认列数 */
export const DEFAULT_GRID_COLUMNS = 2;

// ============ 布局工具函数 ============

/**
 * 根据布局类型获取对应的 CSS 类名
 */
export function getLayoutClassName(layout?: LayoutType): string {
  switch (layout) {
    case LAYOUT_TYPES.GRID:
      return CLASS_NAMES.groupGrid;
    case LAYOUT_TYPES.ICON_GRID:
      return CLASS_NAMES.groupIconGrid;
    default:
      return CLASS_NAMES.groupList;
  }
}

/**
 * 判断是否为纯图标布局
 */
export function isIconOnlyLayout(layout?: LayoutType): boolean {
  return layout === LAYOUT_TYPES.ICON_GRID;
}
