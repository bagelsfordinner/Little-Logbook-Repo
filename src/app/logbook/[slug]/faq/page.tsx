import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLogbookHome, getUserRole } from '@/app/actions/logbook'
import { getLogbookContent } from '@/app/actions/universal-content'
import { Loader } from '@/components/atoms/Loader'
import { PageTransition } from '@/components/wrappers/PageTransition'
import { FAQContentUniversal } from './FAQContentUniversal'
import styles from './page.module.css'

// Loading component
function FAQLoading() {
  return (
    <div className={styles.loading}>
      <Loader size="lg" text="Loading FAQ..." />
    </div>
  )
}

// Main FAQ content server component
async function FAQContentWrapper({ slug }: { slug: string }) {
  const [logbook, userRole, contentResult] = await Promise.all([
    getLogbookHome(slug),
    getUserRole(slug),
    getLogbookContent(slug, 'faq')
  ])

  if (!logbook) {
    redirect('/dashboard')
  }

  // If content failed to load, use default FAQ structure
  const defaultContent = {
    faq: {
      visible: true,
      title: "Frequently Asked Questions",
      description: "Everything you need to know about our journey",
      cards: [
        {
          id: "1",
          question: "When is the baby due?",
          answer: "Our little one is expected to arrive in early 2024. We're so excited!"
        },
        {
          id: "2", 
          question: "Do you know the gender?",
          answer: "We're keeping it as a surprise! We can't wait to meet our baby."
        },
        {
          id: "3",
          question: "How can we help or support you?",
          answer: "Your love and support mean everything to us. Check out our 'How to Help' page for specific ways to contribute."
        }
      ]
    },
    communication: {
      visible: true,
      title: "Communication Guidelines",
      description: "A few gentle reminders about how we'd love to stay connected",
      guidelines: [
        {
          id: "1",
          title: "Reach Out Anytime",
          description: "We love hearing from you! Please feel free to call, text, or visit."
        },
        {
          id: "2",
          title: "Response Time",
          description: "We'll do our best to respond quickly, though we appreciate your patience as we navigate this exciting time."
        }
      ]
    },
    timeline: {
      visible: true,
      title: "Important Dates",
      description: "Key milestones and dates to remember",
      items: [
        {
          id: "1",
          title: "Due Date",
          date: "March 2024",
          description: "Expected arrival of our little one"
        }
      ]
    }
  }

  const initialContent = contentResult.success ? contentResult.data || defaultContent : defaultContent

  return (
    <PageTransition>
      <FAQContentUniversal 
        logbook={logbook} 
        userRole={userRole || 'friend'} 
        initialContent={initialContent}
      />
    </PageTransition>
  )
}

// Main page component
export default async function FAQPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<FAQLoading />}>
      <FAQContentWrapper slug={slug} />
    </Suspense>
  )
}