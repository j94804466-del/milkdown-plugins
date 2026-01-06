import type { MenuItem } from "./types";

export function defaultFilter(items: MenuItem[], query: string): MenuItem[] {
  if (!query) return items;

  const q = query.toLowerCase();

  return items.filter((item) => {
    if (item.label.toLowerCase().includes(q)) return true;
    return (item.keywords ?? []).some((kw) => kw.toLowerCase().includes(q));
  });
}

export function getMatchScore(item: MenuItem, query: string): number {
  if (!query) return 0;

  const q = query.toLowerCase();
  let score = 0;

  const label = item.label.toLowerCase();
  if (label === q) score += 100;
  else if (label.startsWith(q)) score += 80;
  else if (label.includes(q)) score += 60;

  for (const kw of item.keywords ?? []) {
    const k = kw.toLowerCase();
    if (k === q) { score += 90; break; }
    if (k.startsWith(q)) { score += 70; break; }
    if (k.includes(q)) { score += 50; break; }
  }

  return score;
}

export function filterAndSort(items: MenuItem[], query: string): MenuItem[] {
  const filtered = defaultFilter(items, query);
  if (!query) return filtered;
  return filtered.sort((a, b) => getMatchScore(b, query) - getMatchScore(a, query));
}
