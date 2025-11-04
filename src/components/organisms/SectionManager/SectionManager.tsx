'use client'

import { useState } from 'react'
import { PageType, SectionData, DEFAULT_SECTIONS } from '@/lib/constants/pageSections'
import { ensureSectionData } from '@/lib/utils/typeUtils'
import { SectionToggle } from '@/components/molecules/SectionToggle'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { SectionEditor, FieldDefinition } from '@/components/molecules/SectionEditor'
import { toggleSectionVisibility, updatePageSection } from '@/app/actions/content'
import styles from './SectionManager.module.css'

export interface SectionManagerProps {
  pageType: PageType
  logbookSlug: string
  sections: Record<string, SectionData>
  onUpdate: () => void
}

// Helper function to get human-readable section names
const getSectionDisplayName = (pageType: PageType, sectionKey: string): string => {
  const displayNames: Record<string, Record<string, string>> = {
    home: {
      hero: 'Hero Section',
      navigation: 'Navigation Cards',
      stats: 'Statistics'
    },
    help: {
      registry: 'Registry Links',
      plan529: '529 Plan',
      counters: 'Counters',
      giftIdeas: 'Gift Ideas',
      giftsForParents: 'Gifts for Parents',
      whatWeNeed: 'What We Need',
      whatWeDontNeed: "What We Don't Need"
    },
    gallery: {
      header: 'Gallery Header',
      layout: 'Layout Settings',
      filters: 'Filter Options'
    },
    vault: {
      header: 'Vault Header',
      letters: 'Letters Section',
      photos: 'Photos Section',
      recommendations: 'Recommendations'
    },
    faq: {
      hospital: 'Hospital Information',
      visitation: 'Visitation Guidelines',
      parenting: 'Parenting Choices',
      general: 'General Questions'
    }
  }

  return displayNames[pageType]?.[sectionKey] || 
         sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)
}

// Helper function to get section descriptions
const getSectionDescription = (pageType: PageType, sectionKey: string): string => {
  const descriptions: Record<string, Record<string, string>> = {
    home: {
      hero: 'Main banner with title, subtitle, and due date',
      navigation: 'Cards that link to other pages',
      stats: 'Display photo count, comments, and member statistics'
    },
    help: {
      registry: 'Links to your baby registry',
      plan529: 'College savings plan information',
      counters: 'Track quantities of items you need',
      giftIdeas: 'Suggestions for gifts',
      giftsForParents: 'Ways people can support you directly',
      whatWeNeed: 'List of items you need',
      whatWeDontNeed: 'List of items you already have'
    },
    gallery: {
      header: 'Title and description for your photo gallery',
      layout: 'How photos are displayed (grid, columns)',
      filters: 'Options to filter photos by date, type, etc.'
    },
    vault: {
      header: 'Title and description for the memory vault',
      letters: 'Allow people to write letters for the future',
      photos: 'Photo submissions for the vault',
      recommendations: 'Book, movie, restaurant recommendations'
    },
    faq: {
      hospital: 'Information about hospital visits',
      visitation: 'Guidelines for visiting',
      parenting: 'Your parenting philosophy and choices',
      general: 'Other frequently asked questions'
    }
  }

  return descriptions[pageType]?.[sectionKey] || ''
}

// Helper function to get editable fields for each section type
const getEditableFields = (pageType: PageType, sectionKey: string, sectionData: SectionData): FieldDefinition[] => {
  const fields: FieldDefinition[] = []
  
  // Cast sectionData to allow string property access
  const data = sectionData as SectionData & Record<string, string>

  // Common patterns for different section types
  if ('title' in sectionData) {
    fields.push({
      key: 'title',
      label: 'Title',
      type: 'text',
      value: data.title,
      placeholder: 'Enter section title...',
      required: true
    })
  }

  if ('subtitle' in sectionData) {
    fields.push({
      key: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      value: data.subtitle,
      placeholder: 'Enter subtitle...'
    })
  }

  if ('description' in sectionData) {
    fields.push({
      key: 'description',
      label: 'Description',
      type: 'textarea',
      value: data.description,
      placeholder: 'Enter description...'
    })
  }

  if ('imageUrl' in sectionData) {
    fields.push({
      key: 'imageUrl',
      label: 'Image',
      type: 'image',
      value: data.imageUrl,
      placeholder: 'Choose an image...'
    })
  }

  // Specific field handling for certain sections
  if (pageType === 'gallery' && sectionKey === 'layout') {
    fields.push({
      key: 'columns',
      label: 'Number of Columns',
      type: 'number',
      value: data.columns || 3,
      placeholder: '3'
    })
  }

  return fields
}

export function SectionManager({
  pageType,
  logbookSlug,
  sections,
  onUpdate
}: SectionManagerProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set())

  const handleToggleVisibility = async (sectionKey: string, visible: boolean) => {
    setLoadingSections(prev => new Set(prev).add(sectionKey))
    
    try {
      const result = await toggleSectionVisibility(logbookSlug, pageType, sectionKey, visible)
      if (result.success) {
        onUpdate()
      } else {
        console.error('Failed to toggle section visibility:', result.error)
        // In a real app, show error toast here
      }
    } catch (error) {
      console.error('Error toggling section visibility:', error)
    } finally {
      setLoadingSections(prev => {
        const newSet = new Set(prev)
        newSet.delete(sectionKey)
        return newSet
      })
    }
  }

  const handleEditSection = (sectionKey: string) => {
    setEditingSection(sectionKey)
  }

  const handleSaveSection = async (sectionKey: string, updates: Record<string, unknown>) => {
    const result = await updatePageSection(logbookSlug, pageType, sectionKey, updates)
    if (!result.success) {
      throw new Error(result.error || 'Failed to save changes')
    }
    onUpdate()
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
  }

  const pageDisplayName = pageType.charAt(0).toUpperCase() + pageType.slice(1)
  const defaultSections = DEFAULT_SECTIONS[pageType]
  const sectionKeys = Object.keys(defaultSections)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manage {pageDisplayName} Sections</h2>
        <p className={styles.subtitle}>
          Control which sections are visible and edit their content
        </p>
      </div>

      <div className={styles.sections}>
        {sectionKeys.map(sectionKey => {
          const sectionData = ensureSectionData(sections[sectionKey] || (defaultSections as Record<string, unknown>)[sectionKey])
          const displayName = getSectionDisplayName(pageType, sectionKey)
          const description = getSectionDescription(pageType, sectionKey)
          const editableFields = getEditableFields(pageType, sectionKey, sectionData)
          const isLoading = loadingSections.has(sectionKey)
          const isEditing = editingSection === sectionKey

          return (
            <div key={sectionKey} className={styles.sectionCard}>
              {!isEditing ? (
                <>
                  <SectionToggle
                    sectionKey={sectionKey}
                    label={displayName}
                    description={description}
                    visible={sectionData.visible}
                    disabled={isLoading}
                    onToggle={(visible) => handleToggleVisibility(sectionKey, visible)}
                  />
                  
                  {editableFields.length > 0 && (
                    <div className={styles.actions}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditSection(sectionKey)}
                        disabled={isLoading}
                      >
                        <Icon name="edit" size="sm" />
                        Edit Content
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.editor}>
                  <div className={styles.editorHeader}>
                    <h3 className={styles.editorTitle}>Edit {displayName}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                    >
                      <Icon name="x" size="sm" />
                    </Button>
                  </div>
                  
                  <SectionEditor
                    sectionKey={sectionKey}
                    fields={editableFields}
                    onSave={handleSaveSection}
                    onCancel={handleCancelEdit}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}