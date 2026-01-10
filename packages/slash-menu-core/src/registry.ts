import { $ctx } from "@milkdown/kit/utils";

import type { MenuItem, MenuGroup, MenuGroupConfig, MenuItemConfig, Position } from "./types";

export interface MenuRegistry {
  /** 注册一个菜单分组，包含分组配置和可选的菜单项列表 */
  registerGroup(config: MenuGroupConfig): void;
  /** 向指定分组添加单个菜单项 */
  registerItem(groupId: string, item: MenuItemConfig): void;
  /** 在指定分组前插入新分组（通过 position 实现，排序在 getGroups 时处理） */
  insertGroupBefore(targetGroupId: string, config: MenuGroupConfig): void;
  /** 在指定分组后插入新分组（通过 position 实现，排序在 getGroups 时处理） */
  insertGroupAfter(targetGroupId: string, config: MenuGroupConfig): void;
  /** 在指定菜单项前插入新菜单项（通过 position 实现，排序在 getItems 时处理） */
  insertItemBefore(groupId: string, targetItemId: string, item: MenuItemConfig): void;
  /** 在指定菜单项后插入新菜单项（通过 position 实现，排序在 getItems 时处理） */
  insertItemAfter(groupId: string, targetItemId: string, item: MenuItemConfig): void;
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
  /** 获取所有分组，按 priority 降序排列（考虑 position） */
  getGroups(): MenuGroup[];
  /** 根据 ID 获取指定分组 */
  getGroup(groupId: string): MenuGroup | undefined;
  /** 获取指定分组下的所有菜单项，按 priority 降序排列（考虑 position） */
  getItems(groupId: string): MenuItem[];
  /** 根据 ID 获取指定菜单项 */
  getItem(itemId: string): MenuItem | undefined;
  /** 获取所有菜单项 */
  getAllItems(): MenuItem[];
  /** 清空所有分组和菜单项 */
  clear(): void;
}

/** 根据 position 和 priority 排序数组 */
function sortWithPosition<T extends { id: string; priority?: number; position?: Position }>(
  arr: T[]
): T[] {
  // 分离有 position 和没有 position 的项
  const withPosition: T[] = [];
  const withoutPosition: T[] = [];
  
  for (const item of arr) {
    if (item.position && (item.position.before || item.position.after || typeof item.position.index === "number")) {
      withPosition.push(item);
    } else {
      withoutPosition.push(item);
    }
  }
  
  // 没有 position 的项按 priority 排序
  const result = withoutPosition.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  
  // 处理有 position 的项（可能需要多轮，因为可能有依赖关系）
  let pending = [...withPosition];
  let maxIterations = pending.length + 1; // 防止无限循环
  
  while (pending.length > 0 && maxIterations > 0) {
    maxIterations--;
    const stillPending: T[] = [];
    
    for (const item of pending) {
      const { before, after, index } = item.position!;
      let inserted = false;
      
      if (typeof index === "number") {
        // 插入到指定索引
        result.splice(Math.min(index, result.length), 0, item);
        inserted = true;
      } else if (before) {
        const targetIndex = result.findIndex((r) => r.id === before);
        if (targetIndex >= 0) {
          result.splice(targetIndex, 0, item);
          inserted = true;
        }
      } else if (after) {
        const targetIndex = result.findIndex((r) => r.id === after);
        if (targetIndex >= 0) {
          result.splice(targetIndex + 1, 0, item);
          inserted = true;
        }
      }
      
      if (!inserted) {
        stillPending.push(item);
      }
    }
    
    // 如果这一轮没有任何进展，跳出循环
    if (stillPending.length === pending.length) {
      break;
    }
    pending = stillPending;
  }
  
  // 剩余的 pending 项追加到末尾
  result.push(...pending);
  
  return result;
}

export function createMenuRegistry(): MenuRegistry {
  const groups = new Map<string, MenuGroup>();
  const items = new Map<string, MenuItem>();
  // 记录插入顺序，用于 position 计算
  const groupOrder: string[] = [];
  const itemOrder = new Map<string, string[]>(); // groupId -> itemIds

  return {
    registerGroup(config) {
      const { items: itemConfigs, ...groupConfig } = config;
      groups.set(config.id, groupConfig);
      
      if (!groupOrder.includes(config.id)) {
        groupOrder.push(config.id);
      }

      if (itemConfigs) {
        const groupItemOrder = itemOrder.get(config.id) || [];
        itemConfigs.forEach((itemConfig) => {
          items.set(itemConfig.id, {
            ...itemConfig,
            groupId: config.id,
            keywords: itemConfig.keywords ?? [],
          });
          if (!groupItemOrder.includes(itemConfig.id)) {
            groupItemOrder.push(itemConfig.id);
          }
        });
        itemOrder.set(config.id, groupItemOrder);
      }
    },

    registerItem(groupId, itemConfig) {
      items.set(itemConfig.id, {
        ...itemConfig,
        groupId,
        keywords: itemConfig.keywords ?? [],
      });
      
      const groupItemOrder = itemOrder.get(groupId) || [];
      if (!groupItemOrder.includes(itemConfig.id)) {
        groupItemOrder.push(itemConfig.id);
      }
      itemOrder.set(groupId, groupItemOrder);
    },

    insertGroupBefore(targetGroupId, config) {
      // 直接注册分组并设置 position，排序在 getGroups() 时处理
      const { items: itemConfigs, ...groupConfig } = config;
      groups.set(config.id, { ...groupConfig, position: { before: targetGroupId } });
      
      if (!groupOrder.includes(config.id)) {
        groupOrder.push(config.id);
      }
      
      if (itemConfigs) {
        const groupItemOrder = itemOrder.get(config.id) || [];
        itemConfigs.forEach((itemConfig) => {
          items.set(itemConfig.id, {
            ...itemConfig,
            groupId: config.id,
            keywords: itemConfig.keywords ?? [],
          });
          if (!groupItemOrder.includes(itemConfig.id)) {
            groupItemOrder.push(itemConfig.id);
          }
        });
        itemOrder.set(config.id, groupItemOrder);
      }
    },

    insertGroupAfter(targetGroupId, config) {
      // 直接注册分组并设置 position，排序在 getGroups() 时处理
      const { items: itemConfigs, ...groupConfig } = config;
      groups.set(config.id, { ...groupConfig, position: { after: targetGroupId } });
      
      if (!groupOrder.includes(config.id)) {
        groupOrder.push(config.id);
      }
      
      if (itemConfigs) {
        const groupItemOrder = itemOrder.get(config.id) || [];
        itemConfigs.forEach((itemConfig) => {
          items.set(itemConfig.id, {
            ...itemConfig,
            groupId: config.id,
            keywords: itemConfig.keywords ?? [],
          });
          if (!groupItemOrder.includes(itemConfig.id)) {
            groupItemOrder.push(itemConfig.id);
          }
        });
        itemOrder.set(config.id, groupItemOrder);
      }
    },

    insertItemBefore(groupId, targetItemId, itemConfig) {
      // 直接注册菜单项并设置 position，排序在 getItems() 时处理
      items.set(itemConfig.id, {
        ...itemConfig,
        groupId,
        keywords: itemConfig.keywords ?? [],
        position: { before: targetItemId },
      });
      
      const groupItemOrder = itemOrder.get(groupId) || [];
      if (!groupItemOrder.includes(itemConfig.id)) {
        groupItemOrder.push(itemConfig.id);
      }
      itemOrder.set(groupId, groupItemOrder);
    },

    insertItemAfter(groupId, targetItemId, itemConfig) {
      // 直接注册菜单项并设置 position，排序在 getItems() 时处理
      items.set(itemConfig.id, {
        ...itemConfig,
        groupId,
        keywords: itemConfig.keywords ?? [],
        position: { after: targetItemId },
      });
      
      const groupItemOrder = itemOrder.get(groupId) || [];
      if (!groupItemOrder.includes(itemConfig.id)) {
        groupItemOrder.push(itemConfig.id);
      }
      itemOrder.set(groupId, groupItemOrder);
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
      toDelete.forEach((id) => {
        items.delete(id);
        const order = itemOrder.get(groupId);
        if (order) {
          const idx = order.indexOf(id);
          if (idx >= 0) order.splice(idx, 1);
        }
      });
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
        const idx = groupOrder.indexOf(groupId);
        if (idx >= 0) groupOrder.splice(idx, 1);
        
        const itemsToDelete: string[] = [];
        items.forEach((item, id) => {
          if (item.groupId === groupId) itemsToDelete.push(id);
        });
        itemsToDelete.forEach((id) => items.delete(id));
        itemOrder.delete(groupId);
      });
    },

    unregisterGroup(groupId) {
      groups.delete(groupId);
      const idx = groupOrder.indexOf(groupId);
      if (idx >= 0) groupOrder.splice(idx, 1);
      
      const toDelete: string[] = [];
      items.forEach((item, id) => {
        if (item.groupId === groupId) toDelete.push(id);
      });
      toDelete.forEach((id) => items.delete(id));
      itemOrder.delete(groupId);
    },

    unregisterItem(itemId) {
      const item = items.get(itemId);
      if (item) {
        const order = itemOrder.get(item.groupId);
        if (order) {
          const idx = order.indexOf(itemId);
          if (idx >= 0) order.splice(idx, 1);
        }
      }
      items.delete(itemId);
    },

    getGroups() {
      const allGroups = [...groups.values()];
      return sortWithPosition(allGroups);
    },

    getGroup(groupId) {
      return groups.get(groupId);
    },

    getItems(groupId) {
      const groupItems = [...items.values()].filter((i) => i.groupId === groupId);
      return sortWithPosition(groupItems);
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
      groupOrder.length = 0;
      itemOrder.clear();
    },
  };
}

export const menuRegistryCtx = $ctx(createMenuRegistry(), "menuRegistryCtx");
