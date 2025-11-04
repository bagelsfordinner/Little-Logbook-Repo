'use client'

// useState imported but not used
import { ContentProvider } from '@/lib/contexts/ContentContext'
import { EditableSection, EditPanel } from '@/components/universal'
import { EditableText } from '@/components/universal/EditableText'
import { EditableArray } from '@/components/universal/EditableArray'
// Icon imported but not used
import { Header } from '@/components/organisms/Header'
import PageTransition from '@/components/PageTransition'
import { motion } from 'framer-motion'
import styles from './page.module.css'

interface FAQContentUniversalProps {
  logbook: {
    id: string
    slug: string
    name: string
    baby_name?: string
    birth_date?: string
    due_date?: string
  }
  userRole: string
  initialContent?: Record<string, unknown>
}

// FAQ Card Component
function FAQCard({ 
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
      className={styles.faqCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      layout
    >
      <div className={styles.faqQuestion}>
        <EditableText
          path={`${sectionPath}.cards.${index}.question`}
          fallback={question}
          className={styles.questionText}
          element="h3"
          placeholder="Enter your question..."
        />
      </div>
      
      <div className={styles.faqAnswer}>
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

// FAQ Section Component
function FAQSection({ sectionPath }: { sectionPath: string }) {
  const cardTemplate = {
    question: "New Question",
    answer: "Answer goes here..."
  }

  return (
    <div className={styles.faqSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="Frequently Asked Questions"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Everything you need to know"
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
          <FAQCard
            key={`faq-${index}`}
            question={item.question}
            answer={item.answer}
            index={index}
            sectionPath={sectionPath}
          />
        )}
        className={styles.faqCards}
        emptyMessage="No FAQ items yet. Click to add some!"
      />
    </div>
  )
}

// Communication Guidelines Section
function CommunicationSection({ sectionPath }: { sectionPath: string }) {
  const guidelineTemplate = {
    title: "New Guideline",
    description: "Description of this communication guideline"
  }

  return (
    <div className={styles.communicationSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="Communication Guidelines"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
        <EditableText
          path={`${sectionPath}.description`}
          fallback="How we'd love to stay connected"
          className={styles.sectionDescription}
          element="p"
          placeholder="Section description..."
          multiline
        />
      </div>

      <EditableArray
        path={`${sectionPath}.guidelines`}
        itemTemplate={guidelineTemplate}
        renderItem={(item, index) => (
          <motion.div
            key={`guideline-${index}`}
            className={styles.guidelineItem}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <EditableText
              path={`${sectionPath}.guidelines.${index}.title`}
              fallback={item.title}
              className={styles.guidelineTitle}
              element="h3"
              placeholder="Guideline title..."
            />
            <EditableText
              path={`${sectionPath}.guidelines.${index}.description`}
              fallback={item.description}
              className={styles.guidelineDescription}
              element="p"
              placeholder="Guideline description..."
              multiline
            />
          </motion.div>
        )}
        className={styles.guidelinesList}
        emptyMessage="No guidelines yet. Click to add communication preferences!"
        maxItems={10}
      />
    </div>
  )
}

// Timeline Section
function TimelineSection({ sectionPath }: { sectionPath: string }) {
  const timelineTemplate = {
    title: "New Milestone",
    date: "Date",
    description: "Description of this milestone"
  }

  return (
    <div className={styles.timelineSection}>
      <div className={styles.sectionHeader}>
        <EditableText
          path={`${sectionPath}.title`}
          fallback="Important Dates"
          className={styles.sectionTitle}
          element="h2"
          placeholder="Section title..."
        />
        <EditableText
          path={`${sectionPath}.description`}
          fallback="Key milestones and dates to remember"
          className={styles.sectionDescription}
          element="p"
          placeholder="Section description..."
          multiline
        />
      </div>

      <EditableArray
        path={`${sectionPath}.items`}
        itemTemplate={timelineTemplate}
        renderItem={(item, index) => (
          <motion.div
            key={`timeline-${index}`}
            className={styles.timelineItem}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={styles.timelineDate}>
              <EditableText
                path={`${sectionPath}.items.${index}.date`}
                fallback={item.date}
                element="span"
                placeholder="Date..."
              />
            </div>
            <div className={styles.timelineContent}>
              <EditableText
                path={`${sectionPath}.items.${index}.title`}
                fallback={item.title}
                className={styles.timelineTitle}
                element="h3"
                placeholder="Milestone title..."
              />
              <EditableText
                path={`${sectionPath}.items.${index}.description`}
                fallback={item.description}
                className={styles.timelineDescription}
                element="p"
                placeholder="Milestone description..."
                multiline
              />
            </div>
          </motion.div>
        )}
        className={styles.timelineItems}
        emptyMessage="No timeline items yet. Click to add milestones!"
      />
    </div>
  )
}

export function FAQContentUniversal({ 
  logbook, 
  userRole, 
  initialContent = {}
}: FAQContentUniversalProps) {

  // Define sections for the edit panel
  const sections = [
    {
      path: 'faq',
      label: 'FAQ Section',
      description: 'Frequently asked questions and answers'
    },
    {
      path: 'communication',
      label: 'Communication Guidelines', 
      description: 'How family and friends can stay in touch'
    },
    {
      path: 'timeline',
      label: 'Important Dates',
      description: 'Key milestones and dates to remember'
    }
  ]

  return (
    <ContentProvider
      logbookSlug={logbook.slug}
      pageType="faq"
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
              fallback="FAQ & Information"
              className={styles.pageTitle}
              element="h1"
              placeholder="Page title..."
            />
            <EditableText
              path="page.subtitle"
              fallback="Everything you need to know about our journey"
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
            {/* FAQ Section - Large */}
            <motion.div
              className={`${styles.bentoItem} ${styles.large}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <EditableSection path="faq" showToggle={true}>
                <FAQSection sectionPath="faq" />
              </EditableSection>
            </motion.div>

            {/* Communication Section - Medium */}
            <motion.div
              className={`${styles.bentoItem} ${styles.medium}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <EditableSection path="communication" showToggle={true}>
                <CommunicationSection sectionPath="communication" />
              </EditableSection>
            </motion.div>

            {/* Timeline Section - Medium */}
            <motion.div
              className={`${styles.bentoItem} ${styles.medium}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <EditableSection path="timeline" showToggle={true}>
                <TimelineSection sectionPath="timeline" />
              </EditableSection>
            </motion.div>
          </motion.div>

          {/* Edit Panel */}
          <EditPanel sections={sections} pageTitle="FAQ" />
        </motion.div>
      </PageTransition>
    </ContentProvider>
  )
}