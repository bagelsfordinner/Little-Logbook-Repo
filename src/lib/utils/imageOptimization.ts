/**
 * Image optimization utilities for responsive loading and performance
 */

export type ImageContext = 'gallery' | 'avatar' | 'hero' | 'thumbnail' | 'full'

/**
 * Get optimized responsive sizes for different image contexts
 */
export function getResponsiveSizes(context: ImageContext): string {
  switch (context) {
    case 'gallery':
      return "(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
    case 'avatar':
      return "(max-width: 768px) 48px, 64px"
    case 'hero':
      return "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
    case 'thumbnail':
      return "(max-width: 768px) 80px, 120px"
    case 'full':
      return "100vw"
    default:
      return "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  }
}

/**
 * Get optimal image dimensions for different contexts
 */
export function getOptimalDimensions(context: ImageContext) {
  switch (context) {
    case 'gallery':
      return { width: 400, height: 400 }
    case 'avatar':
      return { width: 64, height: 64 }
    case 'hero':
      return { width: 1200, height: 600 }
    case 'thumbnail':
      return { width: 120, height: 120 }
    case 'full':
      return { width: 1920, height: 1080 }
    default:
      return { width: 400, height: 300 }
  }
}

/**
 * Generate blur placeholder from image URL
 */
export function generateBlurPlaceholder(src: string, width = 10, height = 10): string {
  // For production, you'd use a service like Plaiceholder or generate these server-side
  // This is a simple SVG blur placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#f0f2ed" filter="url(#blur)"/>
    </svg>
  `
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Check if image should be priority loaded (above the fold)
 */
export function shouldPrioritizeImage(
  context: ImageContext, 
  index?: number
): boolean {
  switch (context) {
    case 'hero':
      return true
    case 'gallery':
      // Prioritize first 4 gallery images
      return (index ?? 0) < 4
    case 'avatar':
      return true
    default:
      return false
  }
}

/**
 * Optimize image URL for specific use case
 */
export function optimizeImageUrl(
  url: string, 
  context: ImageContext,
  quality = 80
): string {
  // If it's a Supabase URL, add transformation parameters
  if (url.includes('supabase.co')) {
    const dimensions = getOptimalDimensions(context)
    const params = new URLSearchParams({
      width: dimensions.width.toString(),
      height: dimensions.height.toString(),
      quality: quality.toString(),
      format: 'webp'
    })
    
    return `${url}?${params.toString()}`
  }
  
  return url
}

/**
 * Preload critical images
 */
export function preloadCriticalImages(urls: string[]) {
  if (typeof window === 'undefined') return
  
  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

/**
 * Calculate image aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const divisor = gcd(width, height)
  return `${width / divisor}/${height / divisor}`
}