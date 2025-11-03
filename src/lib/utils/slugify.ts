/**
 * Converts a string to a URL-safe slug
 * Examples:
 * - "Smith Family" -> "smith-family"
 * - "The Johnson's Logbook!" -> "the-johnsons-logbook"
 * - "   My Family   " -> "my-family"
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
}

/**
 * Validates if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/**
 * Generates a unique slug by appending a number if necessary
 * This is a client-side helper - server-side validation still needed
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

/**
 * Generates a random suffix for slugs
 */
export function generateRandomSuffix(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Creates a unique slug with random suffix if needed
 */
export function createUniqueSlug(baseName: string): string {
  const baseSlug = slugify(baseName)
  const suffix = generateRandomSuffix()
  return `${baseSlug}-${suffix}`
}