import { $ctx } from "@milkdown/kit/utils";

import type { MenuItem, MenuGroup, MenuGroupConfig, MenuItemConfig } from "./types";

export interface MenuRegistry {
  /** 注册一个菜单分组，包含分组配置和可选的菜单项列表 */
  registerGroup(config: MenuGroupConfig): void;
  /** 向指定分组添加单个菜单项 */
  registerItem(groupId: string, item: MenuItemConfig): void;
  /** 部分更新菜单项，只更新传入的字段，id 和 groupId 不可修改 */
  updateItem(itemId: string, updates: Partial<MenuItemConfig>): boolean;
  /** 部分更新分组属性（不包括 items），id 不可修改 */
  updateGroup(groupId: string, updates: Partial<Omit<MenuGroupConfig, "id" | "items">>): boolean;
  /** 注销指定分组及其下所有菜单项 */
  unregisterGroup(groupId: string): void;
  /** 注销指定菜单项 */
  unregisterItem(itemId: string): void;
  /** 条件过滤分组下的菜单项，predicate 返回 false 的项会被删除 */
  filterItems(groupId: string, predicate: (item: MenuItem) => boolean): void;
  /** 条件过滤分组，predicate 返回 false 的分组及其所有 items 会被删除 */
  filterGroups(predicate: (group: MenuGroup) => boolean): void;
  /** 获取所有分组，按 priority 降序排列 */
  getGroups(): MenuGroup[];
  /** 根据 ID 获取指定分组 */
  getGroup(groupId: string): MenuGroup | undefined;
  /** 获取指定分组下的所有菜单项，按 priority 降序排列 */
  getItems(groupId: string): MenuItem[];
  /** 根据 ID 获取指定菜单项 */
  getItem(itemId: string): MenuItem | undefined;
  /** 获取所有菜单项 */
  getAllItems(): MenuItem[];
  /** 清空所有分组和菜单项 */
  clear(): void;
}

export function createMenuRegistry(): MenuRegistry {
  const groups = new Map<string, MenuGroup>();
  const items = new Map<string, MenuItem>();

  return {
    registerGroup(config) {
      const { items: itemConfigs, ...groupConfig } = config;
      groups.set(config.id, groupConfig);

      if (itemConfigs) {
        itemConfigs.forEach((itemConfig) => {
          items.set(itemConfig.id, {
            ...itemConfig,
            groupId: config.id,
            keywords: itemConfig.keywords ?? [],
          });
        });
      }
    },

    registerItem(groupId, itemConfig) {
      items.set(itemConfig.id, {
        ...itemConfig,
        groupId,
        keywords: itemConfig.keywords ?? [],
      });
    },

    updateItem(itemId, updates) {
      const existing = items.get(itemId);
      if (!existing) return false;
      
      items.set(itemId, {
        ...existing,
        ...updates,
        id: itemId, // id 不可修改
        groupId: existing.groupId, // groupId 不可修改
        keywords: updates.keywords ?? existing.keywords,
      });
      return true;
    },

    updateGroup(groupId, updates) {
      const existing = groups.get(groupId);
      if (!existing) return false;

      groups.set(groupId, {
        ...existing,
        ...updates,
        id: groupId, // id 不可修改
      });
      return true;
    },

    filterItems(groupId, predicate) {
      const toDelete: string[] = [];
      items.forEach((item, id) => {
        if (item.groupId === groupId && !predicate(item)) {
          toDelete.push(id);
        }
      });
      toDelete.forEach((id) => items.delete(id));
    },

    filterGroups(predicate) {
      const toDelete: string[] = [];
      groups.forEach((group, id) => {
        if (!predicate(group)) {
          toDelete.push(id);
        }
      });
      // 删除分组及其下所有 items
      toDelete.forEach((groupId) => {
        groups.delete(groupId);
        const itemsToDelete: string[] = [];
        items.forEach((item, id) => {
          if (item.groupId === groupId) itemsToDelete.push(id);
        });
        itemsToDelete.forEach((id) => items.delete(id));
      });
    },

    unregisterGroup(groupId) {
      groups.delete(groupId);
      const toDelete: string[] = [];
      items.forEach((item, id) => {
        if (item.groupId === groupId) toDelete.push(id);
      });
      toDelete.forEach((id) => items.delete(id));
    },

    unregisterItem(itemId) {
      items.delete(itemId);
    },

    getGroups() {
      return [...groups.values()].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    },

    getGroup(groupId) {
      return groups.get(groupId);
    },

    getItems(groupId) {
      return [...items.values()]
        .filter((i) => i.groupId === groupId)
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    },

    getItem(itemId) {
      return items.get(itemId);
    },

    getAllItems() {
      return [...items.values()];
    },

    clear() {
      groups.clear();
      items.clear();
    },
  };
}

export const menuRegistryCtx = $ctx(createMenuRegistry(), "menuRegistryCtx");
