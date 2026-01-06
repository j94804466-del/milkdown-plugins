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
import React, { useCallback, useEffect, useMemo, useRef } from "react";

// ============ 类型定义 ============

export interface SlashMenuProps {
  state: MenuState;
  callbacks: MenuCallbacks;
  /** 菜单插槽 */
  slots?: MenuSlots;
  /** 是否显示快捷键提示，默认 true */
  showShortcutHints?: boolean;
  /** 国际化标签 */
  i18n?: UILabels;
  /** 自定义整体菜单渲染 */
  renderMenu?: (props: MenuRenderProps) => React.ReactNode;
}

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

// ============ 快捷键提示组件 ============

interface ShortcutHintsProps {
  i18n: UILabels;
  menuShow: boolean;
  menuRef?: React.RefObject<HTMLDivElement | null>;
  onExpand?: () => void;
}

const ShortcutHints: React.FC<ShortcutHintsProps> = ({ i18n, menuShow, menuRef, onExpand }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [rotationIndex, setRotationIndex] = React.useState(0);

  // 菜单打开时，读取并更新轮换索引
  React.useEffect(() => {
    if (menuShow) {
      // 重置展开状态
      setExpanded(false);
      // 恢复菜单高度为 max-height 控制
      if (menuRef?.current) {
        menuRef.current.style.height = "";
      }
      // 读取上次索引
      const stored = localStorage.getItem(STORAGE_KEY);
      const lastIndex = stored ? parseInt(stored, 10) : 0;
      const nextIndex = (lastIndex + 1) % SHORTCUT_GROUPS.length;
      setRotationIndex(nextIndex);
      // 保存新索引
      localStorage.setItem(STORAGE_KEY, String(nextIndex));
    }
  }, [menuShow, menuRef]);

  const handleExpand = () => {
    // 展开前固定菜单高度
    if (menuRef?.current) {
      const currentHeight = menuRef.current.offsetHeight;
      menuRef.current.style.height = `${currentHeight}px`;
    }
    setExpanded(true);
    onExpand?.();
  };

  const handleCollapse = () => {
    setExpanded(false);
    // 收起后恢复菜单高度为 max-height 控制
    if (menuRef?.current) {
      menuRef.current.style.height = "";
    }
  };

  // 当前显示的快捷键（2个）
  const currentShortcuts = SHORTCUT_GROUPS[rotationIndex] || SHORTCUT_GROUPS[0];

  if (expanded) {
    return (
      <div className={`${CLASS_NAMES.hints} expanded`}>
        <div className={CLASS_NAMES.hintsList}>
          {ALL_SHORTCUTS.map((shortcut, idx) => (
            <div key={idx} className={CLASS_NAMES.hintsItem}>
              <kbd>{shortcut.key}</kbd>
              <span>{i18n[shortcut.labelKey]}</span>
            </div>
          ))}
        </div>
        <button
          className={CLASS_NAMES.hintsToggle}
          onClick={handleCollapse}
          title={i18n.collapse}
          dangerouslySetInnerHTML={{ __html: collapseIcon }}
        />
      </div>
    );
  }

  return (
    <div className={CLASS_NAMES.hints}>
      {currentShortcuts.map((shortcut, idx) => (
        <span key={idx}>
          <kbd>{shortcut.key}</kbd> {i18n[shortcut.labelKey]}
        </span>
      ))}
      <button
        className={CLASS_NAMES.hintsToggle}
        onClick={handleExpand}
        title={i18n.expand}
        dangerouslySetInnerHTML={{ __html: expandIcon }}
      />
    </div>
  );
};

// ============ 默认菜单项渲染 ============

export interface DefaultMenuItemProps {
  item: RuntimeMenuItem;
  isActive: boolean;
  iconOnly: boolean;
  onSelect: () => void;
  onHover: (e: React.PointerEvent) => void;
}

export const DefaultMenuItem: React.FC<DefaultMenuItemProps> = ({ 
  item, 
  isActive, 
  iconOnly,
  onSelect, 
  onHover 
}) => {
  return (
    <li
      id={`slash-menu-item-${item.id}`}
      role="option"
      aria-selected={isActive}
      aria-disabled={item.disabled}
      data-index={item.index}
      className={`${CLASS_NAMES.item} ${isActive ? CLASS_NAMES.itemActive : ""} ${item.disabled ? CLASS_NAMES.itemDisabled : ""}`}
      onPointerEnter={onHover}
      onPointerUp={() => !item.disabled && onSelect()}
      title={iconOnly ? item.label : undefined}
    >
      {item.icon && (
        <span
          className={CLASS_NAMES.itemIcon}
          dangerouslySetInnerHTML={{ __html: item.icon }}
          aria-hidden="true"
        />
      )}
      {!iconOnly && (
        <>
          <span className={CLASS_NAMES.itemLabel}>{item.label}</span>
          {item.description && (
            <span className={CLASS_NAMES.itemDesc}>{item.description}</span>
          )}
        </>
      )}
    </li>
  );
};

// ============ 菜单项渲染（支持自定义） ============

interface MenuItemRendererProps {
  item: RuntimeMenuItem;
  isActive: boolean;
  iconOnly: boolean;
  onSelect: (index: number) => void;
  onHover: (index: number, e: React.PointerEvent) => void;
}

const MenuItemRenderer: React.FC<MenuItemRendererProps> = ({
  item,
  isActive,
  iconOnly,
  onSelect,
  onHover,
}) => {
  const handleSelect = useCallback(() => onSelect(item.index), [onSelect, item.index]);
  const handleHover = useCallback(() => onHover(item.index, {} as React.PointerEvent), [onHover, item.index]);
  const handlePointerHover = useCallback((e: React.PointerEvent) => onHover(item.index, e), [onHover, item.index]);

  // 如果有自定义渲染
  if (item.renderItem) {
    const props: ItemRenderProps = {
      item,
      isActive,
      onSelect: handleSelect,
      onHover: handleHover,
    };
    return <>{item.renderItem(props)}</>;
  }

  // 默认渲染
  return (
    <DefaultMenuItem
      item={item}
      isActive={isActive}
      iconOnly={iconOnly}
      onSelect={handleSelect}
      onHover={handlePointerHover}
    />
  );
};

// ============ 默认分组渲染 ============

export interface DefaultMenuGroupProps {
  group: RuntimeMenuGroup;
  activeIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number, e: React.PointerEvent) => void;
}

export const DefaultMenuGroup: React.FC<DefaultMenuGroupProps> = ({ 
  group, 
  activeIndex, 
  onSelect, 
  onHover 
}) => {
  const layoutClass = getLayoutClassName(group.layout);
  const iconOnly = isIconOnlyLayout(group.layout);
  const labelId = `slash-menu-group-label-${group.id}`;

  const gridStyle = group.layout === "grid"
    ? { "--milkdown-slash-menu-grid-columns": group.columns ?? DEFAULT_GRID_COLUMNS } as React.CSSProperties
    : undefined;

  return (
    <div 
      className={`${CLASS_NAMES.group} ${layoutClass}`}
      role="group"
      aria-labelledby={labelId}
    >
      <div id={labelId} className={CLASS_NAMES.groupLabel}>{group.label}</div>
      <ul 
        className={CLASS_NAMES.groupItems} 
        style={gridStyle}
        role="listbox"
      >
        {group.items.map((item) => (
          <MenuItemRenderer
            key={item.id}
            item={item}
            isActive={activeIndex === item.index}
            iconOnly={iconOnly}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}
      </ul>
    </div>
  );
};

// ============ 分组渲染（支持自定义） ============

interface MenuGroupRendererProps {
  group: RuntimeMenuGroup;
  activeIndex: number;
  onSelect: (index: number) => void;
  onHover: (index: number, e: React.PointerEvent) => void;
}

const MenuGroupRenderer: React.FC<MenuGroupRendererProps> = ({
  group,
  activeIndex,
  onSelect,
  onHover,
}) => {
  // 如果有自定义渲染
  if (group.renderGroup) {
    const props: GroupRenderProps = {
      group,
      activeIndex,
      onSelect,
      onHover: (index) => onHover(index, {} as React.PointerEvent),
      defaultRender: () => (
        <DefaultMenuGroup
          group={group}
          activeIndex={activeIndex}
          onSelect={onSelect}
          onHover={onHover}
        />
      ),
    };
    return <>{group.renderGroup(props)}</>;
  }

  // 默认渲染
  return (
    <DefaultMenuGroup
      group={group}
      activeIndex={activeIndex}
      onSelect={onSelect}
      onHover={onHover}
    />
  );
};

// ============ 默认菜单渲染 ============

export interface DefaultSlashMenuProps {
  state: MenuState;
  callbacks: MenuCallbacks;
  slots?: MenuSlots;
  showShortcutHints?: boolean;
  i18n?: UILabels;
}

export const DefaultSlashMenu: React.FC<DefaultSlashMenuProps> = ({ 
  state, 
  callbacks, 
  slots,
  showShortcutHints = true,
  i18n = DEFAULT_UI_LABELS,
}) => {
  const { groups, activeIndex, show, totalCount } = state;
  const { onSelect, onHover } = callbacks;

  const menuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLElement>(null);
  const prevMousePos = useRef({ x: -999, y: -999 });

  const activeGroupId = useMemo(() => {
    for (const group of groups) {
      if (activeIndex >= group.range[0] && activeIndex < group.range[1]) {
        return group.id;
      }
    }
    return groups[0]?.id;
  }, [groups, activeIndex]);

  // 滚动标签栏
  useEffect(() => {
    if (!tabsRef.current || !activeGroupId) return;
    const activeTab = tabsRef.current.querySelector<HTMLElement>(`[data-group-id="${activeGroupId}"]`);
    if (!activeTab) return;

    const tabsRect = tabsRef.current.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    if (tabRect.left < tabsRect.left) {
      tabsRef.current.scrollLeft -= tabsRect.left - tabRect.left + 10;
    } else if (tabRect.right > tabsRect.right) {
      tabsRef.current.scrollLeft += tabRect.right - tabsRect.right + 10;
    }
  }, [activeGroupId]);

  // 滚动到激活项
  useEffect(() => {
    if (!scrollRef.current) return;
    
    // 如果是第一个菜单项，直接滚动到顶部
    if (activeIndex === 0) {
      scrollRef.current.scrollTop = 0;
      return;
    }
    
    // 如果是最后一个菜单项，直接滚动到底部
    if (activeIndex === totalCount - 1) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      return;
    }
    
    const target = scrollRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    if (!target) return;

    // 检查是否是分组的第一个项
    const currentGroup = groups.find(
      (g) => activeIndex >= g.range[0] && activeIndex < g.range[1]
    );
    const isFirstInGroup = currentGroup && activeIndex === currentGroup.range[0];

    if (isFirstInGroup) {
      // 如果是分组第一项，滚动到分组容器（包含标签）
      const groupEl = target.closest(`.${CLASS_NAMES.group}`);
      groupEl?.scrollIntoView({ block: "nearest" });
    } else {
      target.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, groups, totalCount]);

  const handleTabClick = useCallback((groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group) onHover(group.range[0]);
  }, [groups, onHover]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleItemHover = useCallback((index: number, e: React.PointerEvent) => {
    const { x, y } = prevMousePos.current;
    if (e.clientX !== x || e.clientY !== y) {
      onHover(index);
    }
  }, [onHover]);

  // 空状态
  if (totalCount === 0) {
    return (
      <div 
        className={CLASS_NAMES.menu} 
        data-show={show}
        role="dialog"
        aria-label="Slash menu"
      >
        {slots?.empty ? (
          <>{slots.empty()}</>
        ) : (
          <div className={CLASS_NAMES.empty} role="status">{i18n.noResults}</div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={menuRef}
      className={CLASS_NAMES.menu} 
      data-show={show} 
      onPointerMove={handlePointerMove}
      role="dialog"
      aria-label="Slash menu"
    >
      {/* beforeHeader 插槽 */}
      {slots?.beforeHeader && <>{slots.beforeHeader()}</>}

      {/* tabs (header) */}
      <nav ref={tabsRef} className={CLASS_NAMES.tabs} aria-label="Menu groups">
        <ul role="tablist">
          {groups.map((group) => (
            <li
              key={group.id}
              role="tab"
              aria-selected={activeGroupId === group.id}
              aria-controls={`slash-menu-group-${group.id}`}
              data-group-id={group.id}
              className={activeGroupId === group.id ? "active" : ""}
              onPointerDown={() => handleTabClick(group.id)}
            >
              {group.label}
            </li>
          ))}
        </ul>
      </nav>

      {/* afterHeader 插槽 */}
      {slots?.afterHeader && <>{slots.afterHeader()}</>}

      {/* body (滚动区域) */}
      <div ref={scrollRef} className={CLASS_NAMES.body}>
        {/* beforeContent 插槽 */}
        {slots?.beforeContent && <>{slots.beforeContent()}</>}
        {/* content */}
        <div className={CLASS_NAMES.content}>
          {groups.map((group) => (
            <MenuGroupRenderer
              key={group.id}
              group={group}
              activeIndex={activeIndex}
              onSelect={onSelect}
              onHover={handleItemHover}
            />
          ))}
        </div>
        {/* afterContent 插槽 */}
        {slots?.afterContent && <>{slots.afterContent()}</>}
        {/* 快捷键提示 (内部组件，在 body 内部，sticky 定位) */}
        {showShortcutHints && (
          <ShortcutHints 
            i18n={i18n} 
            menuShow={show}
            menuRef={menuRef}
            onExpand={() => {
              requestAnimationFrame(() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
              });
            }}
          />
        )}
      </div>

      {/* beforeFooter 插槽 */}
      {slots?.beforeFooter && <>{slots.beforeFooter()}</>}

      {/* footer 插槽 */}
      {slots?.footer && <>{slots.footer()}</>}

      {/* afterFooter 插槽 */}
      {slots?.afterFooter && <>{slots.afterFooter()}</>}
    </div>
  );
};

// ============ 主组件（支持三层自定义） ============

export const SlashMenu: React.FC<SlashMenuProps> = ({ 
  state, 
  callbacks, 
  slots, 
  showShortcutHints = true,
  i18n = DEFAULT_UI_LABELS,
  renderMenu,
}) => {
  // 如果有自定义整体渲染
  if (renderMenu) {
    const props: MenuRenderProps = {
      state,
      callbacks,
      slots,
      defaultRender: () => (
        <DefaultSlashMenu 
          state={state} 
          callbacks={callbacks} 
          slots={slots} 
          showShortcutHints={showShortcutHints}
          i18n={i18n}
        />
      ),
    };
    return <>{renderMenu(props)}</>;
  }

  // 默认渲染
  return (
    <DefaultSlashMenu 
      state={state} 
      callbacks={callbacks} 
      slots={slots} 
      showShortcutHints={showShortcutHints}
      i18n={i18n}
    />
  );
};
