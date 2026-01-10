import type { MenuItem, MenuGroup } from "./types";

/** 扩展的菜单项，包含分组信息用于搜索 */
export interface MenuItemWithGroup extends MenuItem {
  _group?: MenuGroup;
}

export function defaultFilter(items: MenuItemWithGroup[], query: string): MenuItemWithGroup[] {
  if (!query) return items;

  const q = query.toLowerCase();

  return items.filter((item) => {
    // 菜单项 label
    if (item.label?.toLowerCase().includes(q)) return true;
    // 菜单项 keywords
    if ((item.keywords ?? []).some((kw) => kw.toLowerCase().includes(q))) return true;
    // 分组 label
    if (item._group?.label?.toLowerCase().includes(q)) return true;
    // 分组 keywords
    if ((item._group?.keywords ?? []).some((kw) => kw.toLowerCase().includes(q))) return true;
    return false;
  });
}

export function getMatchScore(item: MenuItemWithGroup, query: string): number {
  if (!query) return 0;

  const q = query.toLowerCase();
  let score = 0;

  // 菜单项 label 匹配
  const label = (item.label ?? "").toLowerCase();
  if (label === q) score += 100;
  else if (label.startsWith(q)) score += 80;
  else if (label.includes(q)) score += 60;

  // 菜单项 keywords 匹配
  for (const kw of item.keywords ?? []) {
    const k = kw.toLowerCase();
    if (k === q) { score += 90; break; }
    if (k.startsWith(q)) { score += 70; break; }
    if (k.includes(q)) { score += 50; break; }
  }

  // 分组 label 匹配（权重稍低）
  if (item._group) {
    const groupLabel = (item._group.label ?? "").toLowerCase();
    if (groupLabel === q) score += 40;
    else if (groupLabel.startsWith(q)) score += 30;
    else if (groupLabel.includes(q)) score += 20;

    // 分组 keywords 匹配
    for (const kw of item._group.keywords ?? []) {
      const k = kw.toLowerCase();
      if (k === q) { score += 35; break; }
      if (k.startsWith(q)) { score += 25; break; }
      if (k.includes(q)) { score += 15; break; }
    }
  }

  return score;
}

export function filterAndSort(items: MenuItemWithGroup[], query: string): MenuItemWithGroup[] {
  const filtered = defaultFilter(items, query);
  if (!query) return filtered;
  return filtered.sort((a, b) => getMatchScore(b, query) - getMatchScore(a, query));
}
