/**
 * Performance monitoring and Web Vitals tracking
 */

// Core Web Vitals measurement
export interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB'
  value: number
  delta: number
  id: string
  navigationType: string
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  // In production, send to your analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Google Analytics
    // gtag('event', metric.name, {
    //   value: Math.round(metric.value),
    //   metric_id: metric.id,
    //   metric_delta: metric.delta,
    //   custom_map: { metric_name: metric.name }
    // })
    
    // Example: Custom analytics endpoint
    // fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(metric)
    // })
  } else {
    // Log in development
    console.log('Web Vital:', metric)
  }
}

/**
 * Performance observer for monitoring
 */
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null
  private metrics: Map<string, number> = new Map()

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupObserver()
    }
  }

  private setupObserver() {
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processEntry(entry)
        }
      })

      // Observe different types of performance entries
      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'paint'] })
    } catch (error) {
      console.warn('Performance Observer not supported:', error)
    }
  }

  private processEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.trackNavigationTiming(entry as PerformanceNavigationTiming)
        break
      case 'resource':
        this.trackResourceTiming(entry as PerformanceResourceTiming)
        break
      case 'paint':
        this.trackPaintTiming(entry)
        break
      case 'measure':
        this.trackCustomMeasure(entry)
        break
    }
  }

  private trackNavigationTiming(entry: PerformanceNavigationTiming) {
    const metrics = {
      'page-load-time': entry.loadEventEnd - entry.navigationStart,
      'dom-content-loaded': entry.domContentLoadedEventEnd - entry.navigationStart,
      'first-byte': entry.responseStart - entry.navigationStart,
      'dom-interactive': entry.domInteractive - entry.navigationStart,
    }

    Object.entries(metrics).forEach(([name, value]) => {
      this.metrics.set(name, value)
    })

    // Report slow page loads
    if (metrics['page-load-time'] > 3000) {
      this.reportSlowPerformance('page-load', metrics['page-load-time'])
    }
  }

  private trackResourceTiming(entry: PerformanceResourceTiming) {
    // Track slow resources
    const duration = entry.responseEnd - entry.startTime
    
    if (duration > 1000) {
      this.reportSlowPerformance('resource-load', duration, {
        url: entry.name,
        type: this.getResourceType(entry.name)
      })
    }
  }

  private trackPaintTiming(entry: PerformanceEntry) {
    this.metrics.set(entry.name, entry.startTime)
    
    // Report slow First Contentful Paint
    if (entry.name === 'first-contentful-paint' && entry.startTime > 2500) {
      this.reportSlowPerformance('first-contentful-paint', entry.startTime)
    }
  }

  private trackCustomMeasure(entry: PerformanceEntry) {
    this.metrics.set(entry.name, entry.duration)
  }

  private getResourceType(url: string): string {
    if (url.includes('/_next/static/')) return 'static'
    if (url.includes('/_next/image')) return 'image'
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image'
    return 'other'
  }

  private reportSlowPerformance(type: string, value: number, extra?: Record<string, unknown>) {
    const report = {
      type,
      value: Math.round(value),
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      ...extra
    }

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.warn('Slow performance detected:', report)
    }

    // In production, send to monitoring service
    // this.sendToMonitoring(report)
  }

  /**
   * Manually measure a custom operation
   */
  measureCustom<T>(name: string, fn: () => Promise<T> | T): Promise<T> | T {
    const startMark = `${name}-start`
    const endMark = `${name}-end`
    
    performance.mark(startMark)
    
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        performance.mark(endMark)
        performance.measure(name, startMark, endMark)
      })
    } else {
      performance.mark(endMark)
      performance.measure(name, startMark, endMark)
      return result
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  /**
   * Stop monitoring
   */
  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

/**
 * Initialize performance monitoring
 */
let performanceMonitor: PerformanceMonitor | null = null

export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

/**
 * Measure database query performance
 */
export function measureQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now()
  
  return queryFn().then(
    (result) => {
      const duration = performance.now() - startTime
      
      // Log slow queries
      if (duration > 500) {
        console.warn(`Slow query: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      // Track in performance monitoring
      if (performanceMonitor) {
        performanceMonitor.measureCustom(`query-${queryName}`, () => duration)
      }
      
      return result
    },
    (error) => {
      const duration = performance.now() - startTime
      console.error(`Failed query: ${queryName} after ${duration.toFixed(2)}ms`, error)
      throw error
    }
  )
}

/**
 * Component render time tracking
 */
export function measureComponentRender(componentName: string) {
  const startTime = performance.now()
  
  return () => {
    const renderTime = performance.now() - startTime
    
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`)
    }
    
    if (performanceMonitor) {
      performanceMonitor.measureCustom(`render-${componentName}`, () => renderTime)
    }
  }
}

/**
 * Memory usage monitoring
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      total: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    }
  }
  return null
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const connection = (navigator as { connection?: { effectiveType: string; downlink: number; rtt: number } }).connection
    return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
  }
  return false
}