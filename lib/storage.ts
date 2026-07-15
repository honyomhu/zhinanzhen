const CACHE_PREFIX = "jianli_";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number; // 毫秒
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * 保存数据到 localStorage（带 TTL）
 */
export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  if (!isBrowser()) return;

  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
    ttl: ttlMs,
  };

  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (error) {
    console.warn("localStorage 写入失败，可能已满:", error);
  }
}

/**
 * 从 localStorage 读取数据（自动检查过期）
 */
export function getCache<T>(key: string): T | null {
  if (!isBrowser()) return null;

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const now = Date.now();

    // 检查是否过期
    if (now - entry.cachedAt > entry.ttl) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * 删除指定缓存
 */
export function removeCache(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(CACHE_PREFIX + key);
}

/**
 * 清空所有本应用的缓存
 */
export function clearAllCache(): void {
  if (!isBrowser()) return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}

/**
 * 检查缓存是否仍然有效
 */
export function isCacheValid(key: string): boolean {
  return getCache(key) !== null;
}

/**
 * 获取缓存的剩余有效时间（毫秒），过期返回 0
 */
export function getCacheRemainingTTL(key: string): number {
  if (!isBrowser()) return 0;

  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return 0;

    const entry: CacheEntry<unknown> = JSON.parse(raw);
    const now = Date.now();
    const remaining = entry.ttl - (now - entry.cachedAt);
    return Math.max(0, remaining);
  } catch {
    return 0;
  }
}
