/**
 * Database query optimization utilities
 */

import { createClient } from '@supabase/supabase-js'

// Simple in-memory cache
const queryCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

/**
 * Cache query results with TTL
 */
export function cacheQuery<T>(
  key: string, 
  data: T, 
  ttlMinutes: number = 5
): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000
  })
}

/**
 * Get cached query result
 */
export function getCachedQuery<T>(key: string): T | null {
  const cached = queryCache.get(key)
  if (!cached) return null
  
  const isExpired = Date.now() - cached.timestamp > cached.ttl
  if (isExpired) {
    queryCache.delete(key)
    return null
  }
  
  return cached.data as T
}

/**
 * Clear cache by pattern
 */
export function clearCachePattern(pattern: string): void {
  for (const key of queryCache.keys()) {
    if (key.includes(pattern)) {
      queryCache.delete(key)
    }
  }
}

/**
 * Optimized gallery images query with pagination
 */
export async function getOptimizedGalleryImages(
  supabase: ReturnType<typeof createClient>,
  logbookId: string,
  page: number = 0,
  limit: number = 20
) {
  const cacheKey = `gallery_${logbookId}_${page}_${limit}`
  const cached = getCachedQuery(cacheKey)
  if (cached) return cached

  const offset = page * limit
  
  const { data, error } = await supabase
    .from('gallery_images')
    .select(`
      id,
      file_url,
      thumbnail_url,
      caption,
      upload_date,
      uploader_name,
      file_size,
      mime_type
    `)
    .eq('logbook_id', logbookId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error

  // Cache for 5 minutes
  cacheQuery(cacheKey, data, 5)
  
  return data
}

/**
 * Optimized logbook stats query
 */
export async function getOptimizedLogbookStats(
  supabase: ReturnType<typeof createClient>,
  logbookId: string
) {
  const cacheKey = `stats_${logbookId}`
  const cached = getCachedQuery(cacheKey)
  if (cached) return cached

  // Use parallel queries for better performance
  const [imagesResult, timelineResult, vaultResult, membersResult] = await Promise.all([
    supabase
      .from('gallery_images')
      .select('id', { count: 'exact', head: true })
      .eq('logbook_id', logbookId),
    
    supabase
      .from('timeline_events')
      .select('id', { count: 'exact', head: true })
      .eq('logbook_id', logbookId),
    
    supabase
      .from('vault_entries')
      .select('id', { count: 'exact', head: true })
      .eq('logbook_id', logbookId),
    
    supabase
      .from('logbook_members')
      .select('id', { count: 'exact', head: true })
      .eq('logbook_id', logbookId)
  ])

  const stats = {
    imageCount: imagesResult.count || 0,
    timelineCount: timelineResult.count || 0,
    vaultCount: vaultResult.count || 0,
    memberCount: membersResult.count || 0
  }

  // Cache for 10 minutes
  cacheQuery(cacheKey, stats, 10)
  
  return stats
}

/**
 * Optimized user logbooks query
 */
export async function getOptimizedUserLogbooks(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const cacheKey = `user_logbooks_${userId}`
  const cached = getCachedQuery(cacheKey)
  if (cached) return cached

  const { data, error } = await supabase
    .from('logbook_members')
    .select(`
      role,
      last_visited_at,
      logbook:logbooks (
        id,
        name,
        slug,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('last_visited_at', { ascending: false, nullsLast: true })

  if (error) throw error

  const formattedData = data?.map(member => ({
    id: member.logbook.id,
    name: member.logbook.name,
    slug: member.logbook.slug,
    role: member.role,
    last_visited_at: member.last_visited_at,
    created_at: member.logbook.created_at
  })) || []

  // Cache for 3 minutes (user data changes more frequently)
  cacheQuery(cacheKey, formattedData, 3)
  
  return formattedData
}

/**
 * Batch invalidate cache for a logbook
 */
export function invalidateLogbookCache(logbookId: string): void {
  clearCachePattern(logbookId)
}

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now()
    
    try {
      const result = await fn(...args)
      const duration = performance.now() - startTime
      
      // In production, send to analytics
      if (typeof window !== 'undefined' && duration > 1000) {
        console.warn(`Slow query detected: ${operationName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`Query failed: ${operationName} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  }
}

/**
 * Debounced search function to reduce API calls
 */
export function createDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delayMs: number = 300
) {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (query: string): Promise<T[]> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(async () => {
        try {
          const results = await searchFn(query)
          resolve(results)
        } catch (error) {
          reject(error)
        }
      }, delayMs)
    })
  }
}