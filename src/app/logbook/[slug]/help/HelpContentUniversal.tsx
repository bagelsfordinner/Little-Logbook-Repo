'use client'

import { ReactNode } from 'react'
import { ContentProvider, useContent } from '@/lib/contexts/ContentContext'
import { EditableSection, EditPanel } from '@/components/universal'
import { EditableText } from '@/components/universal/EditableText'
import { EditableArray } from '@/components/universal/EditableArray'
import { Icon, type IconName } from '@/components/atoms/Icon'
import { ProgressBar } from '@/components/atoms/ProgressBar'
import { IconPicker } from '@/components/molecules/IconPicker'
import { Header } from '@/components/organisms/Header'
import PageTransition from '@/components/PageTransition'
import { motion } from 'framer-motion'
import styles from './page.module.css'

// Define types for Help content items
interface HelpItem {
  id?: string
  title: string
  description?: string
  icon?: string
  current?: number
  max?: number
  link?: string
  category?: string
  date?: string
  notes?: string
}


interface HelpContentUniversalProps {
  logbook: {
    id: string
    slug: string
    name: string
    baby_name?: string
    birth_date?: string
    due_date?: string
    page_sections?: Record<string, unknown>
  }
  userRole: string
  initialContent?: Record<string, unknown>
}

// Helping Guidelines Card Component (similar to FAQ)
function HelpingGuidelineCard({ 
  question, 
  answer, 
  index,
  sectionPath
}: { 
  question: string
  answer: string 
  index: number
  sectionPath: string
}) {
  return (
    <motion.div
      className={styles.guidelineCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      layout
    >
      <div className={styles.guidelineQuestion}>
        <EditableText
          path={`${sectionPath}.cards.${index}.question`}
          fallback={question}
          className={styles.questionText}
          element="h3"
          placeholder="Enter your question..."
        />
      </div>
      
      <div className={styles.guidelineAnswer}>
        <EditableText
          path={`${sectionPath}.cards.${index}.answer`}
          fallback={answer}
          className={styles.answerText}
          element="p"
          placeholder="Enter your answer..."
          multiline
        />
      </div>
    </motion.div>
  )
}

// Helping Guidelines Section
function HelpingGuidelinesSection({ sectionPath }: { sectionPath: string }) {
  const cardTemplate = {
    question: "How can I help?",
    answer: "Your support means everything to us. Here are some ways you can help..."
  }

  return (
    <div className={styles.helpingGuidelinesSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="How to Help"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Ways you can support our growing family"
          className={styles.sectionDescription}
          element="p"
          placeholder="Section description..."
          multiline
        />
      </div>

      <EditableArray
        path={`${sectionPath}.cards`}
        itemTemplate={cardTemplate}
        renderItem={(item, index) => (
          <HelpingGuidelineCard
            question={item.question}
            answer={item.answer}
            index={index}
            sectionPath={sectionPath}
          />
        )}
        className={styles.guidelinesCards}
        emptyMessage="No guidelines yet. Click to add some!"
      />
    </div>
  )
}

// Registry Section
function RegistrySection({ sectionPath }: { sectionPath: string }) {
  const { getContent, isEditMode, userRole } = useContent()
  
  return (
    <div className={styles.linkSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="Baby Registry"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
      </div>

      <div className={styles.linkContent}>
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Find the perfect gifts for our little one on our registry."
          className={styles.linkDescription}
          element="p"
          placeholder="Registry description..."
          multiline
        />

        <div className={styles.linkButtonContainer}>
          <a
            href={getContent(`${sectionPath}.link.url`, "https://registry.babylist.com") as string}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkButton}
          >
            <Icon name="external-link" size="sm" />
            <EditableText
              path={`${sectionPath}.link.text`}
              fallback="View Registry"
              element="span"
              placeholder="Button text..."
            />
          </a>
          {isEditMode && userRole === 'parent' && (
            <div className={styles.linkUrlEditor}>
              <label className={styles.urlLabel}>Link URL:</label>
              <EditableText
                path={`${sectionPath}.link.url`}
                fallback="https://registry.babylist.com"
                element="span"
                className={styles.urlInput}
                placeholder="Enter URL..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 529 Section
function FiveTwentyNineSection({ sectionPath }: { sectionPath: string }) {
  const { getContent, isEditMode, userRole } = useContent()
  
  return (
    <div className={styles.linkSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="529 Education Fund"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
      </div>

      <div className={styles.linkContent}>
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Help us save for our baby's future education."
          className={styles.linkDescription}
          element="p"
          placeholder="529 description..."
          multiline
        />

        <div className={styles.linkButtonContainer}>
          <a
            href={getContent(`${sectionPath}.link.url`, "https://529plan.com") as string}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.linkButton}
          >
            <Icon name="external-link" size="sm" />
            <EditableText
              path={`${sectionPath}.link.text`}
              fallback="Contribute to 529"
              element="span"
              placeholder="Button text..."
            />
          </a>
          {isEditMode && userRole === 'parent' && (
            <div className={styles.linkUrlEditor}>
              <label className={styles.urlLabel}>Link URL:</label>
              <EditableText
                path={`${sectionPath}.link.url`}
                fallback="https://529plan.com"
                element="span"
                className={styles.urlInput}
                placeholder="Enter URL..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Essential Item Component
function EssentialItem({ 
  item, 
  index, 
  sectionPath, 
  userRole,
  onQuantityChange,
  onIconChange,
  onMaxChange,
  isEditMode
}: { 
  item: HelpItem
  index: number
  sectionPath: string
  userRole: string
  onQuantityChange: (index: number, delta: number) => void
  onIconChange: (index: number, icon: IconName) => void
  onMaxChange: (index: number, max: number) => void
  isEditMode: boolean
}) {
  const isParent = userRole === 'parent'
  const current = item.current || 0
  const max = item.max || 10

  return (
    <motion.div
      className={styles.essentialItem}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className={styles.essentialItemHeader}>
        <div className={styles.essentialItemIcon}>
          <IconPicker
            value={(item.icon as IconName) || 'circle'}
            onChange={(iconName) => onIconChange(index, iconName)}
            asClickable={isEditMode}
            disabled={!isEditMode}
          />
        </div>
        <EditableText
          path={`${sectionPath}.items.${index}.title`}
          fallback={item.title}
          className={styles.essentialItemTitle}
          element="h3"
          placeholder="Item name..."
        />
      </div>

      <div className={styles.progressContainer}>
        <ProgressBar
          value={current}
          max={max}
          size="md"
          showLabel={true}
          label={`${current}/${max}`}
        />
      </div>

      {isParent && (
        <div className={styles.essentialItemControls}>
          <button
            className={styles.quantityButton}
            onClick={() => onQuantityChange(index, -1)}
            disabled={current <= 0}
            aria-label="Decrease quantity"
          >
            <Icon name="minus" size="xs" />
          </button>
          <span className={styles.quantityValue}>{current}</span>
          {isEditMode && (
            <input
              type="number"
              value={max}
              onChange={(e) => onMaxChange(index, parseInt(e.target.value) || 1)}
              min="1"
              max="100"
              className={styles.maxInput}
              aria-label="Maximum quantity"
            />
          )}
          <button
            className={styles.quantityButton}
            onClick={() => onQuantityChange(index, 1)}
            disabled={current >= max}
            aria-label="Increase quantity"
          >
            <Icon name="plus" size="xs" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// Essential Items Section
function EssentialItemsSection({ sectionPath, userRole }: { sectionPath: string, userRole: string }) {
  const { updateContent, getContent, isEditMode } = useContent()
  
  const itemTemplate = {
    title: "New Item",
    icon: "circle" as IconName,
    current: 0,
    max: 10
  }

  const defaultEssentialItems = [
    { title: "Diapers", icon: "circle" as IconName, current: 0, max: 100 },
    { title: "Baby Formula", icon: "heart" as IconName, current: 0, max: 10 },
    { title: "Baby Clothes (0-3 months)", icon: "user" as IconName, current: 0, max: 20 },
    { title: "Baby Bottles", icon: "circle" as IconName, current: 0, max: 8 },
    { title: "Burp Cloths", icon: "square" as IconName, current: 0, max: 15 },
    { title: "Baby Blankets", icon: "square" as IconName, current: 0, max: 5 },
    { title: "Pacifiers", icon: "circle" as IconName, current: 0, max: 4 },
    { title: "Baby Wipes", icon: "square" as IconName, current: 0, max: 20 }
  ]

  const handleAutoFill = async () => {
    await updateContent(`${sectionPath}.items`, defaultEssentialItems)
  }

  const handleQuantityChange = async (index: number, delta: number) => {
    const items = getContent(`${sectionPath}.items`, []) as any[] // eslint-disable-line @typescript-eslint/no-explicit-any
    if (items && items[index]) {
      const newCurrent = Math.max(0, Math.min((items[index].current || 0) + delta, items[index].max || 10))
      const updatedItems = [...items]
      updatedItems[index] = { ...updatedItems[index], current: newCurrent }
      await updateContent(`${sectionPath}.items`, updatedItems)
    }
  }

  const handleIconChange = async (index: number, icon: IconName) => {
    const items = getContent(`${sectionPath}.items`, []) as unknown as HelpItem[]
    if (items && items[index]) {
      const updatedItems = [...items]
      updatedItems[index] = { ...updatedItems[index], icon }
      await updateContent(`${sectionPath}.items`, updatedItems)
    }
  }

  const handleMaxChange = async (index: number, max: number) => {
    const items = getContent(`${sectionPath}.items`, []) as unknown as HelpItem[]
    if (items && items[index]) {
      const updatedItems = [...items]
      updatedItems[index] = { ...updatedItems[index], max }
      await updateContent(`${sectionPath}.items`, updatedItems)
    }
  }

  return (
    <div className={styles.essentialItemsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <EditableText
            path={`${sectionPath}.title`}
            fallback="Essential Items"
            className={styles.sectionTitle}
            element="h2"
            placeholder="Section title..."
          />
          {isEditMode && userRole === 'parent' && (
            <button
              onClick={handleAutoFill}
              className={styles.autoFillButton}
              title="Auto-fill with common baby essentials"
            >
              <Icon name="plus-circle" size="sm" />
              Auto-fill Essentials
            </button>
          )}
        </div>
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Everyday items we need for our baby"
          className={styles.sectionDescription}
          element="p"
          placeholder="Section description..."
          multiline
        />
      </div>

      <EditableArray
        path={`${sectionPath}.items`}
        itemTemplate={itemTemplate}
        renderItem={(item, index) => (
          <EssentialItem
            item={item}
            index={index}
            sectionPath={sectionPath}
            userRole={userRole}
            onQuantityChange={handleQuantityChange}
            onIconChange={handleIconChange}
            onMaxChange={handleMaxChange}
            isEditMode={isEditMode}
          />
        )}
        className={styles.essentialItemsGrid}
        emptyMessage="No essential items yet. Click to add some!"
      />
    </div>
  )
}

// Gift Item Component
function GiftItem({ 
  item, 
  index, 
  sectionPath, 
  parentIndex,
  onIconChange
}: { 
  item: HelpItem
  index: number
  sectionPath: string
  parentIndex: number
  onIconChange: (index: number, icon: IconName) => void
}) {
  const { isEditMode } = useContent()

  return (
    <motion.div
      className={styles.giftItem}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className={styles.giftIcon}>
        <IconPicker
          value={(item.icon as IconName) || 'heart'}
          onChange={(iconName) => onIconChange(index, iconName)}
          asClickable={isEditMode}
          disabled={!isEditMode}
        />
      </div>
      <EditableText
        path={`${sectionPath}.parents.${parentIndex}.gifts.${index}.title`}
        fallback={item.title}
        className={styles.giftTitle}
        element="span"
        placeholder="Gift idea..."
      />
    </motion.div>
  )
}

// Gifts for Parents Section
function GiftsForParentsSection({ sectionPath }: { sectionPath: string }) {
  const { updateContent, getContent } = useContent()
  
  const giftTemplate = {
    title: "New Gift Idea",
    icon: "heart" as IconName
  }

  const handleIconChange = async (parentIndex: number, giftIndex: number, icon: IconName) => {
    const gifts = getContent(`${sectionPath}.parents.${parentIndex}.gifts`, []) as unknown as HelpItem[]
    if (gifts && gifts[giftIndex]) {
      const updatedGifts = [...gifts]
      updatedGifts[giftIndex] = { ...updatedGifts[giftIndex], icon }
      await updateContent(`${sectionPath}.parents.${parentIndex}.gifts`, updatedGifts)
    }
  }

  return (
    <div className={styles.giftsForParentsSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="Gifts for Parents"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Little things that always bring us joy"
          className={styles.sectionDescription}
          element="p"
          placeholder="Section description..."
          multiline
        />
      </div>

      <div className={styles.parentsGrid}>
        {/* Parent 1 */}
        <div className={styles.parentColumn}>
          <div className={styles.parentHeader}>
            <EditableText
              path={`${sectionPath}.parents.0.name`}
              fallback="Parent 1"
              className={styles.parentTitle}
              element="h3"
              placeholder="Parent name..."
            />
          </div>
          <EditableArray
            path={`${sectionPath}.parents.0.gifts`}
            itemTemplate={giftTemplate}
            renderItem={(item, index) => (
              <GiftItem
                item={item}
                index={index}
                sectionPath={sectionPath}
                parentIndex={0}
                onIconChange={(giftIndex, icon) => handleIconChange(0, giftIndex, icon)}
              />
            )}
            className={styles.giftsList}
            emptyMessage="No gift ideas yet!"
            maxItems={8}
          />
        </div>

        {/* Parent 2 */}
        <div className={styles.parentColumn}>
          <div className={styles.parentHeader}>
            <EditableText
              path={`${sectionPath}.parents.1.name`}
              fallback="Parent 2"
              className={styles.parentTitle}
              element="h3"
              placeholder="Parent name..."
            />
          </div>
          <EditableArray
            path={`${sectionPath}.parents.1.gifts`}
            itemTemplate={giftTemplate}
            renderItem={(item, index) => (
              <GiftItem
                item={item}
                index={index}
                sectionPath={sectionPath}
                parentIndex={1}
                onIconChange={(giftIndex, icon) => handleIconChange(1, giftIndex, icon)}
              />
            )}
            className={styles.giftsList}
            emptyMessage="No gift ideas yet!"
            maxItems={8}
          />
        </div>
      </div>
    </div>
  )
}

// Special Occasion Item Component
function SpecialOccasionItem({ 
  item, 
  index, 
  sectionPath 
}: { 
  item: HelpItem
  index: number
  sectionPath: string
}) {
  return (
    <motion.div
      className={styles.occasionItem}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className={styles.occasionDate}>
        <EditableText
          path={`${sectionPath}.occasions.${index}.date`}
          fallback={item.date}
          element="span"
          placeholder="Date..."
        />
      </div>
      <div className={styles.occasionContent}>
        <EditableText
          path={`${sectionPath}.occasions.${index}.title`}
          fallback={item.title}
          className={styles.occasionTitle}
          element="h3"
          placeholder="Event title..."
        />
        <EditableText
          path={`${sectionPath}.occasions.${index}.notes`}
          fallback={item.notes}
          className={styles.occasionNotes}
          element="p"
          placeholder="Event notes..."
          multiline
        />
      </div>
    </motion.div>
  )
}

// Special Occasions Section
function SpecialOccasionsSection({ sectionPath }: { sectionPath: string }) {
  const occasionTemplate = {
    title: "Special Event",
    date: "TBD",
    notes: "Details about this special occasion"
  }

  return (
    <div className={styles.specialOccasionsSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="Special Occasions"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Important dates and celebrations coming up"
          className={styles.sectionDescription}
          element="p"
          placeholder="Section description..."
          multiline
        />
      </div>

      <EditableArray
        path={`${sectionPath}.occasions`}
        itemTemplate={occasionTemplate}
        renderItem={(item, index) => (
          <SpecialOccasionItem
            item={item}
            index={index}
            sectionPath={sectionPath}
          />
        )}
        className={styles.occasionsList}
        emptyMessage="No special occasions yet. Click to add some!"
      />
    </div>
  )
}

// Conditional Section Wrapper
function ConditionalSection({ 
  path, 
  children, 
  className, 
  style,
  ...motionProps 
}: { 
  path: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}) {
  const { isSectionVisible, isEditMode, canEdit } = useContent()
  
  const isVisible = isSectionVisible(path)
  const actualVisibility = isVisible !== undefined ? isVisible : true
  const showEditUI = isEditMode && canEdit(path)

  // Don't render the container at all if section is hidden and user can't edit
  if (!actualVisibility && !showEditUI) {
    return null
  }

  return (
    <motion.div
      className={className}
      style={style}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}

export function HelpContentUniversal({ 
  logbook, 
  userRole, 
  initialContent = {}
}: HelpContentUniversalProps) {


  // Define sections for the edit panel
  const sections = [
    {
      path: 'guidelines',
      label: 'Helping Guidelines',
      description: 'Ways family and friends can help and support you'
    },
    {
      path: 'registry',
      label: 'Baby Registry',
      description: 'Link to your baby registry'
    },
    {
      path: 'fivetwentynine',
      label: '529 Education Fund',
      description: 'Link to education savings plan'
    },
    {
      path: 'essentials',
      label: 'Essential Items',
      description: 'Everyday items needed for baby'
    },
    {
      path: 'gifts',
      label: 'Gifts for Parents',
      description: 'Gift ideas that always bring joy to parents'
    },
    {
      path: 'occasions',
      label: 'Special Occasions',
      description: 'Important dates and celebrations'
    }
  ]

  return (
    <ContentProvider
      logbookSlug={logbook.slug}
      pageType="help"
      userRole={userRole as 'parent' | 'family' | 'friend'}
      initialContent={initialContent}
    >
      <PageTransition>
        <motion.div 
          className={styles.page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Header
            logbookName={logbook.name}
            logbookSlug={logbook.slug}
            logbookId={logbook.id}
            userName="Current User"
            userRole={(userRole as 'parent' | 'family' | 'friend') || 'friend'}
            currentPath="Help"
          />
          
          {/* Page Header */}
          <motion.div
            className={styles.pageHeader}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <EditableText
              path="page.title"
              fallback="How to Help"
              className={styles.pageTitle}
              element="h1"
              placeholder="Page title..."
            />
            <EditableText
              path="page.subtitle"
              fallback="Ways you can support our growing family"
              className={styles.pageSubtitle}
              element="p"
              placeholder="Page subtitle..."
              multiline
            />
          </motion.div>

          {/* Bento Box Grid */}
          <motion.div
            className={styles.bentoGrid}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Top Row */}
            {/* Helping Guidelines - Large */}
            <ConditionalSection
              path="guidelines"
              className={`${styles.bentoItem} ${styles.extraLarge}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <EditableSection path="guidelines" showToggle={true}>
                <HelpingGuidelinesSection sectionPath="guidelines" />
              </EditableSection>
            </ConditionalSection>

            {/* Right Column - Registry and 529 stacked */}
            <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateRows: '1fr 1fr', gap: '1.5rem' }}>
              {/* Registry - Small */}
              <ConditionalSection
                path="registry"
                className={`${styles.bentoItem}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                style={{ margin: 0 }}
              >
                <EditableSection path="registry" showToggle={true}>
                  <RegistrySection sectionPath="registry" />
                </EditableSection>
              </ConditionalSection>

              {/* 529 - Small */}
              <ConditionalSection
                path="fivetwentynine"
                className={`${styles.bentoItem}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                style={{ margin: 0 }}
              >
                <EditableSection path="fivetwentynine" showToggle={true}>
                  <FiveTwentyNineSection sectionPath="fivetwentynine" />
                </EditableSection>
              </ConditionalSection>
            </div>

            {/* Essential Items - Full Width */}
            <ConditionalSection
              path="essentials"
              className={`${styles.bentoItem} ${styles.full}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <EditableSection path="essentials" showToggle={true}>
                <EssentialItemsSection sectionPath="essentials" userRole={userRole} />
              </EditableSection>
            </ConditionalSection>

            {/* Bottom Row - Flexible Container */}
            <div className={styles.bottomRowContainer}>
              {/* Gifts for Parents - Medium */}
              <ConditionalSection
                path="gifts"
                className={`${styles.bentoItem} ${styles.bottomRowItem}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <EditableSection path="gifts" showToggle={true}>
                  <GiftsForParentsSection sectionPath="gifts" />
                </EditableSection>
              </ConditionalSection>

              {/* Special Occasions - Medium */}
              <ConditionalSection
                path="occasions"
                className={`${styles.bentoItem} ${styles.bottomRowItem}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <EditableSection path="occasions" showToggle={true}>
                  <SpecialOccasionsSection sectionPath="occasions" />
                </EditableSection>
              </ConditionalSection>
            </div>
          </motion.div>

          {/* Edit Panel */}
          <EditPanel sections={sections} pageTitle="Help" />
        </motion.div>
      </PageTransition>
    </ContentProvider>
  )
}