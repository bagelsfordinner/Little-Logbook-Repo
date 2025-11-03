/**
 * Server-side memory caching with LRU eviction
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  lastAccessed: number
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private defaultTTL: number

  constructor(maxSize = 1000, defaultTTLMs = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.defaultTTL = defaultTTLMs
  }

  set(key: string, value: T, ttlMs?: number): void {
    const now = Date.now()
    const ttl = ttlMs || this.defaultTTL

    // Remove expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup()
      
      // If still full after cleanup, remove LRU entry
      if (this.cache.size >= this.maxSize) {
        const lruKey = this.findLRUKey()
        if (lruKey) {
          this.cache.delete(lruKey)
        }
      }
    }

    this.cache.set(key, {
      data: value,
      timestamp: now,
      ttl,
      lastAccessed: now
    })
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    
    // Check if expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update last accessed time
    entry.lastAccessed = now
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.cache.delete(key))
  }

  private findLRUKey(): string | null {
    let lruKey: string | null = null
    let oldestAccess = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed
        lruKey = key
      }
    }

    return lruKey
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let totalSize = 0
    let expiredCount = 0

    for (const [, entry] of this.cache.entries()) {
      totalSize++
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++
      }
    }

    return {
      totalEntries: totalSize,
      expiredEntries: expiredCount,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses for this
    }
  }
}

// Global cache instances
const dataCache = new LRUCache<unknown>(1000, 5 * 60 * 1000) // 5 minutes default
const userCache = new LRUCache<unknown>(500, 3 * 60 * 1000)  // 3 minutes for user data
const statsCache = new LRUCache<unknown>(100, 10 * 60 * 1000) // 10 minutes for stats

/**
 * Cache wrapper with automatic key generation
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttlMs?: number
    cacheType?: 'data' | 'user' | 'stats'
  } = {}
): Promise<T> {
  const { ttlMs, cacheType = 'data' } = options
  
  const cache = getCacheInstance(cacheType)
  
  // Try to get from cache first
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Cache the result
  cache.set(key, data, ttlMs)
  
  return data
}

/**
 * Invalidate cache entries by pattern
 */
export function invalidateCache(pattern: string, cacheType: 'data' | 'user' | 'stats' = 'data'): void {
  const cache = getCacheInstance(cacheType)
  
  // Since we can't iterate over Map keys with pattern matching easily,
  // we'll need to clear the entire cache or implement a more sophisticated pattern matching
  // For now, we'll clear if pattern is '*' or matches specific prefixes
  if (pattern === '*') {
    cache.clear()
  } else {
    // For specific patterns, we'd need to implement pattern matching
    // This is a simplified version
    cache.delete(pattern)
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats() {
  return {
    data: dataCache.getStats(),
    user: userCache.getStats(),
    stats: statsCache.getStats(),
  }
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpCache(logbookId: string, fetchFunctions: {
  getLogbook: () => Promise<unknown>
  getStats: () => Promise<unknown>
  getRecentImages: () => Promise<unknown>
}) {
  try {
    await Promise.all([
      withCache(`logbook_${logbookId}`, fetchFunctions.getLogbook, { 
        cacheType: 'data', 
        ttlMs: 10 * 60 * 1000 
      }),
      withCache(`stats_${logbookId}`, fetchFunctions.getStats, { 
        cacheType: 'stats', 
        ttlMs: 15 * 60 * 1000 
      }),
      withCache(`recent_images_${logbookId}`, fetchFunctions.getRecentImages, { 
        cacheType: 'data', 
        ttlMs: 5 * 60 * 1000 
      }),
    ])
  } catch (error) {
    console.error('Cache warm-up failed:', error)
  }
}

function getCacheInstance(type: 'data' | 'user' | 'stats') {
  switch (type) {
    case 'user':
      return userCache
    case 'stats':
      return statsCache
    default:
      return dataCache
  }
}

// Export cache instances for direct use if needed
export { dataCache, userCache, statsCache }