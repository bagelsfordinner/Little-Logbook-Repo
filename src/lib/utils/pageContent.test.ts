/**
 * Testing utilities and examples for page content management.
 * These examples demonstrate the core functionality without requiring a test framework.
 */

import { 
  getPageSections, 
  getSectionValue, 
  isSectionVisible,
  updateSectionInSections,
  getSectionDifferences
} from './pageContent'

// ============================================================
// EXAMPLE 1: Default sections structure
// ============================================================

/*
console.log('DEFAULT_SECTIONS.home:', DEFAULT_SECTIONS.home)
Output:
{
  hero: {
    visible: true,
    imageUrl: null,
    title: "Welcome to Our Journey",
    subtitle: "Following our adventure",
    showDueDate: true
  },
  navigation: {
    visible: true,
    cards: ["gallery", "help", "vault", "faq", "admin"]
  },
  stats: {
    visible: false,
    showPhotoCount: true,
    showCommentCount: true,
    showMemberCount: true
  }
}
*/

// ============================================================
// EXAMPLE 2: Merging with overrides
// ============================================================

/*
// Simulate database data with partial overrides
const dbPageSections = {
  home: {
    hero: {
      title: "Our Baby's Journey", // Override default title
      visible: false // Hide the hero section
    },
    stats: {
      visible: true // Show stats (default is hidden)
    }
    // navigation section will use all defaults
  }
}

const mergedSections = getPageSections(dbPageSections, 'home')
console.log('Merged home sections:', mergedSections)

Output:
{
  hero: {
    visible: false, // OVERRIDDEN
    imageUrl: null, // DEFAULT
    title: "Our Baby's Journey", // OVERRIDDEN
    subtitle: "Following our adventure", // DEFAULT
    showDueDate: true // DEFAULT
  },
  navigation: {
    // ALL DEFAULTS since no overrides provided
    visible: true,
    cards: ["gallery", "help", "vault", "faq", "admin"]
  },
  stats: {
    visible: true, // OVERRIDDEN
    showPhotoCount: true, // DEFAULT
    showCommentCount: true, // DEFAULT
    showMemberCount: true // DEFAULT
  }
}
*/

// ============================================================
// EXAMPLE 3: Getting specific section values
// ============================================================

/*
const sections = getPageSections(dbPageSections, 'home')

const heroTitle = getSectionValue(sections, 'hero', 'title')
console.log('Hero title:', heroTitle) // "Our Baby's Journey"

const showDueDate = getSectionValue(sections, 'hero', 'showDueDate')
console.log('Show due date:', showDueDate) // true

const navigationCards = getSectionValue(sections, 'navigation', 'cards')
console.log('Navigation cards:', navigationCards) // ["gallery", "help", "vault", "faq", "admin"]
*/

// ============================================================
// EXAMPLE 4: Visibility checks
// ============================================================

/*
const sections = getPageSections(dbPageSections, 'home')

const heroVisible = isSectionVisible(sections, 'hero')
console.log('Hero visible:', heroVisible) // false (was overridden)

const navigationVisible = isSectionVisible(sections, 'navigation')
console.log('Navigation visible:', navigationVisible) // true (default)

const statsVisible = isSectionVisible(sections, 'stats')
console.log('Stats visible:', statsVisible) // true (was overridden)
*/

// ============================================================
// EXAMPLE 5: Updating sections
// ============================================================

/*
const currentSections = getPageSections(dbPageSections, 'home')

// Update hero section with new title and visibility
const updatedSections = updateSectionInSections(
  currentSections,
  'hero',
  {
    title: "Welcome to Baby Smith's Adventure",
    visible: true,
    imageUrl: "https://example.com/hero.jpg"
  }
)

console.log('Updated hero section:', updatedSections.hero)
Output:
{
  visible: true, // UPDATED
  imageUrl: "https://example.com/hero.jpg", // UPDATED
  title: "Welcome to Baby Smith's Adventure", // UPDATED
  subtitle: "Following our adventure", // PRESERVED
  showDueDate: true // PRESERVED
}
*/

// ============================================================
// EXAMPLE 6: Getting differences for database storage
// ============================================================

/*
const sections = getPageSections(dbPageSections, 'home')
const differences = getSectionDifferences(sections, 'home')

console.log('Differences from defaults:', differences)
Output:
{
  hero: {
    title: "Our Baby's Journey",
    visible: false
  },
  stats: {
    visible: true
  }
  // navigation section has no differences, so it's not included
}

// This minimal object is what should be stored in the database
// to avoid duplicating default values
*/

// ============================================================
// EXAMPLE 7: Working with other page types
// ============================================================

/*
// Help page example
const helpOverrides = {
  help: {
    registry: {
      visible: false // Hide registry section
    },
    plan529: {
      visible: true, // Show 529 plan (default is hidden)
      title: "Baby's College Fund",
      description: "Help us save for college!",
      accountInfo: "Account #12345"
    }
  }
}

const helpSections = getPageSections(helpOverrides, 'help')

const registryVisible = isSectionVisible(helpSections, 'registry')
console.log('Registry visible:', registryVisible) // false

const plan529Title = getSectionValue(helpSections, 'plan529', 'title')
console.log('529 plan title:', plan529Title) // "Baby's College Fund"
*/

// ============================================================
// EXAMPLE 8: Error handling examples
// ============================================================

/*
// Null/undefined database data
const emptySections = getPageSections(null, 'home')
console.log('Empty sections equal defaults:', 
  JSON.stringify(emptySections) === JSON.stringify(DEFAULT_SECTIONS.home)
) // true

// Invalid section key (TypeScript will catch this, but runtime fallback)
const invalidValue = getSectionValue(emptySections, 'nonexistent' as any, 'title')
console.log('Invalid section value:', invalidValue) // undefined

// Invalid field key
const invalidField = getSectionValue(emptySections, 'hero', 'invalidField' as any)
console.log('Invalid field value:', invalidField) // undefined
*/

// ============================================================
// EXAMPLE USAGE IN COMPONENTS
// ============================================================

/*
// Example React component usage:

import { usePageContent } from '@/lib/hooks/usePageContent'
import { isSectionVisible, getSectionValue } from '@/lib/utils/pageContent'

function HomePage({ logbookSlug }: { logbookSlug: string }) {
  const { sections, loading, error } = usePageContent('home', logbookSlug)
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!sections) return <div>No content found</div>
  
  return (
    <div>
      {isSectionVisible(sections, 'hero') && (
        <HeroSection 
          title={getSectionValue(sections, 'hero', 'title')}
          subtitle={getSectionValue(sections, 'hero', 'subtitle')}
          imageUrl={getSectionValue(sections, 'hero', 'imageUrl')}
          showDueDate={getSectionValue(sections, 'hero', 'showDueDate')}
        />
      )}
      
      {isSectionVisible(sections, 'navigation') && (
        <NavigationSection 
          cards={getSectionValue(sections, 'navigation', 'cards')}
        />
      )}
      
      {isSectionVisible(sections, 'stats') && (
        <StatsSection 
          showPhotoCount={getSectionValue(sections, 'stats', 'showPhotoCount')}
          showCommentCount={getSectionValue(sections, 'stats', 'showCommentCount')}
          showMemberCount={getSectionValue(sections, 'stats', 'showMemberCount')}
        />
      )}
    </div>
  )
}
*/

export {
  // Re-export main functions for easy testing
  getPageSections,
  getSectionValue,
  isSectionVisible,
  updateSectionInSections,
  getSectionDifferences
}