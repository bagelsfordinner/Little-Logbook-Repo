/**
 * Type utility functions for safe type conversions
 * Used to handle unknown types and type assertions safely
 */

import type { SectionData } from '@/lib/constants/pageSections'

export const safeString = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value)
}

export const safeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  return Boolean(value)
}

export const safeNumber = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export const safeObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
    return value as Record<string, unknown>
  }
  return {}
}

export const safeArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  return []
}

// Section-specific type guards

export const ensureSectionData = (value: unknown): SectionData => {
  const obj = safeObject(value)
  return {
    visible: safeBoolean(obj.visible ?? true),
    ...obj
  }
}

// Content type guards
export const isValidContentType = (type: string): type is 'text' | 'textarea' | 'image' | 'boolean' | 'array' | 'number' => {
  return ['text', 'textarea', 'image', 'boolean', 'array', 'number'].includes(type)
}