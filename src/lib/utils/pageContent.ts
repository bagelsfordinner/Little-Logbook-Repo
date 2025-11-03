/**
 * Utility functions for managing page content and sections.
 * Provides core logic for reading and merging page sections with defaults.
 */

import { merge } from 'lodash';
import { 
  DEFAULT_SECTIONS, 
  PageType, 
  PageSections,
  PageTypeSections,
  SectionKey
} from '@/lib/constants/pageSections';

/**
 * Merges logbook-specific page sections with default sections.
 * Performs a deep merge to ensure defaults are preserved when overrides are partial.
 * 
 * @param logbookPageSections - Raw page_sections JSONB data from database
 * @param pageType - The specific page type to get sections for
 * @returns Merged sections with defaults + overrides
 * 
 * @example
 * const sections = getPageSections(
 *   { home: { hero: { title: "Custom Title" } } },
 *   'home'
 * );
 * // Returns: default home sections with hero.title overridden
 */
export function getPageSections<T extends PageType>(
  logbookPageSections: Record<string, unknown> | null | undefined,
  pageType: T
): PageTypeSections<T> {
  const defaultPageSections = DEFAULT_SECTIONS[pageType];
  
  if (!logbookPageSections || !logbookPageSections[pageType]) {
    return defaultPageSections;
  }
  
  // Deep merge: defaults + overrides
  return merge({}, defaultPageSections, logbookPageSections[pageType]);
}

/**
 * Safely retrieves a specific field value from a section.
 * Returns the default value if the override doesn't exist.
 * 
 * @param sections - The merged sections object for a page
 * @param sectionKey - The section identifier (e.g., 'hero', 'navigation')
 * @param fieldKey - The field within the section (e.g., 'title', 'visible')
 * @returns The field value or undefined if not found
 * 
 * @example
 * const title = getSectionValue(sections, 'hero', 'title');
 * const isVisible = getSectionValue(sections, 'hero', 'visible');
 */
export function getSectionValue<
  T extends PageType,
  K extends SectionKey<T>,
  F extends keyof PageSections[T][K]
>(
  sections: PageTypeSections<T>,
  sectionKey: K,
  fieldKey: F
): PageSections[T][K][F] | undefined {
  const section = sections[sectionKey];
  if (!section || typeof section !== 'object') {
    return undefined;
  }
  
  return (section as Record<string, unknown>)[fieldKey as string] as PageSections[T][K][F] | undefined;
}

/**
 * Checks if a specific section is visible.
 * All sections must have a 'visible' boolean property.
 * 
 * @param sections - The merged sections object for a page
 * @param sectionKey - The section identifier to check
 * @returns true if section is visible, false otherwise
 * 
 * @example
 * const showHero = isSectionVisible(sections, 'hero');
 * const showStats = isSectionVisible(sections, 'stats');
 */
export function isSectionVisible<
  T extends PageType,
  K extends SectionKey<T>
>(
  sections: PageTypeSections<T>,
  sectionKey: K
): boolean {
  const visible = getSectionValue(sections, sectionKey, 'visible' as keyof PageSections[T][K]);
  return Boolean(visible);
}

/**
 * Creates a deep copy of sections with specific field updates.
 * Useful for creating updated sections objects before saving to database.
 * 
 * @param sections - Current sections object
 * @param sectionKey - The section to update
 * @param updates - Partial updates to apply to the section
 * @returns New sections object with updates applied
 * 
 * @example
 * const updated = updateSectionInSections(
 *   currentSections,
 *   'hero',
 *   { title: "New Title", visible: false }
 * );
 */
export function updateSectionInSections<
  T extends PageType,
  K extends SectionKey<T>
>(
  sections: PageTypeSections<T>,
  sectionKey: K,
  updates: Partial<PageSections[T][K]>
): PageTypeSections<T> {
  return merge({}, sections, {
    [sectionKey]: updates
  });
}

/**
 * Validates that a sections object has the required structure.
 * Checks that all sections have the required 'visible' property.
 * 
 * @param sections - Sections object to validate
 * @param pageType - Expected page type for validation
 * @returns true if valid, false otherwise
 */
export function validatePageSections<T extends PageType>(
  sections: unknown,
  pageType: T
): sections is PageTypeSections<T> {
  if (!sections || typeof sections !== 'object') {
    return false;
  }
  
  const defaultSections = DEFAULT_SECTIONS[pageType];
  
  // Check that all default section keys exist and have 'visible' property
  for (const sectionKey of Object.keys(defaultSections)) {
    const section = (sections as Record<string, unknown>)[sectionKey];
    if (!section || typeof section !== 'object' || typeof (section as Record<string, unknown>).visible !== 'boolean') {
      return false;
    }
  }
  
  return true;
}

/**
 * Gets only the differences between current sections and defaults.
 * Useful for storing minimal overrides in the database.
 * 
 * @param sections - Current sections object
 * @param pageType - Page type to compare against defaults
 * @returns Object containing only the differences from defaults
 */
export function getSectionDifferences<T extends PageType>(
  sections: PageTypeSections<T>,
  pageType: T
): Partial<PageTypeSections<T>> {
  const defaults = DEFAULT_SECTIONS[pageType];
  const differences: Record<string, unknown> = {};
  
  for (const [sectionKey, sectionData] of Object.entries(sections)) {
    const defaultSection = (defaults as Record<string, unknown>)[sectionKey];
    const currentSection = sectionData;
    
    // Find differences in this section
    const sectionDiffs: Record<string, unknown> = {};
    let hasDifferences = false;
    
    for (const [fieldKey, fieldValue] of Object.entries(currentSection)) {
      const defaultValue = defaultSection && typeof defaultSection === 'object' 
        ? (defaultSection as Record<string, unknown>)[fieldKey] 
        : undefined;
      if (JSON.stringify(fieldValue) !== JSON.stringify(defaultValue)) {
        sectionDiffs[fieldKey] = fieldValue;
        hasDifferences = true;
      }
    }
    
    if (hasDifferences) {
      differences[sectionKey] = sectionDiffs;
    }
  }
  
  return differences as Partial<PageTypeSections<T>>;
}