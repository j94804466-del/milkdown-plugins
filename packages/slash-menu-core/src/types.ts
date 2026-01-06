import type { Ctx } from "@milkdown/kit/ctx";

import type { LayoutType } from "./constants";

// ============ 菜单项类型 ============

/** 菜单项配置（注册时使用） */
export interface MenuItemConfig {
  id: string;
  label: string;
  keywords?: string[];
  icon?: string;
  description?: string;
  disabled?: boolean;
  action: (ctx: Ctx) => void;
  priority?: number;
  meta?: Record<string, unknown>;
  /** 自定义菜单项渲染 */
  renderItem?: (props: ItemRenderProps) => unknown;
}

/** 菜单项（内部存储） */
export interface MenuItem extends MenuItemConfig {
  groupId: string;
}

/** 菜单分组配置 */
export interface MenuGroupConfig {
  id: string;
  label: string;
  layout?: LayoutType;
  columns?: number;
  priority?: number;
  meta?: Record<string, unknown>;
  items?: MenuItemConfig[];
  /** 自定义分组渲染 */
  renderGroup?: (props: GroupRenderProps) => unknown;
}

/** 菜单分组（内部存储） */
export interface MenuGroup extends Omit<MenuGroupConfig, "items"> {}

/** 运行时菜单项（带全局索引） */
export interface RuntimeMenuItem extends MenuItem {
  index: number;
}

/** 运行时分组（带菜单项和索引范围） */
export interface RuntimeMenuGroup extends MenuGroup {
  items: RuntimeMenuItem[];
  range: [number, number];
}

// ============ 插槽类型 ============

/** 菜单插槽配置 */
export interface MenuSlots {
  // 头部区域 (header = tabs)
  /** 标签栏前 */
  beforeHeader?: () => unknown;
  /** 标签栏后 */
  afterHeader?: () => unknown;

  // 内容区域 (body 内，可滚动)
  /** 内容区前 */
  beforeContent?: () => unknown;
  /** 内容区后 */
  afterContent?: () => unknown;

  // 底部区域 (body 外，固定)
  /** 底部插槽前 */
  beforeFooter?: () => unknown;
  /** 底部插槽 */
  footer?: () => unknown;
  /** 底部插槽后 */
  afterFooter?: () => unknown;

  // 特殊状态
  /** 空状态自定义渲染 */
  empty?: () => unknown;
}

// ============ 渲染 Props 类型 ============

/** 菜单项渲染 Props */
export interface ItemRenderProps {
  item: RuntimeMenuItem;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
}

/** 分组渲染 Props */
export interface GroupRenderProps {
  group: RuntimeMenuGroup;
  activeIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  defaultRender: () => unknown;
}

/** 菜单整体渲染 Props */
export interface MenuRenderProps {
  state: MenuState;
  callbacks: MenuCallbacks;
  slots?: MenuSlots;
  defaultRender: () => unknown;
}

// ============ 渲染器接口 ============

/** 菜单状态 */
export interface MenuState {
  groups: RuntimeMenuGroup[];
  activeIndex: number;
  filter: string;
  totalCount: number;
  show: boolean;
}

/** 菜单事件回调 */
export interface MenuCallbacks {
  onSelect: (index: number) => void;
  onHover: (index: number) => void;
  onClose: () => void;
}

/** 渲染器接口 */
export interface SlashMenuRenderer {
  mount(container: HTMLElement): void;
  update(state: MenuState, callbacks: MenuCallbacks): void;
  unmount(): void;
}

/** 渲染器工厂函数类型 */
export type RendererFactory = () => SlashMenuRenderer;

// ============ 插件配置 ============

/** 位置配置 */
export interface PositionOptions {
  /** 偏移量，默认 10 */
  offset?: number;
  /** 优先方向，默认 "bottom" */
  placement?: "top" | "bottom";
}

export interface SlashMenuOptions {
  trigger?: string;
  filter?: (items: MenuItem[], query: string) => MenuItem[];
  renderer?: RendererFactory;
  /** 自定义整体菜单渲染 */
  renderMenu?: (props: MenuRenderProps) => unknown;
  /** 菜单插槽配置 */
  slots?: MenuSlots;
  /** 是否显示快捷键提示，默认 true */
  showShortcutHints?: boolean;
  /** 位置配置 */
  position?: PositionOptions;
  /** 内部使用：UI 标签 */
  _uiLabels?: {
    noResults: string;
    navigate: string;
    select: string;
    close: string;
  };
  /** 事件钩子 */
  onOpen?: () => void;
  onClose?: () => void;
  onSelect?: (item: MenuItem) => void;
  onFilter?: (query: string, results: MenuItem[]) => void;
}
