import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLogbookHome, getUserRole } from '@/app/actions/logbook'
import { getCurrentUser } from '@/app/actions/dashboard'
import { getLogbookContent } from '@/app/actions/universal-content'
import { Loader } from '@/components/atoms/Loader'
import { PageTransition } from '@/components/wrappers/PageTransition'
import { HelpContentUniversal } from './HelpContentUniversal'
import styles from './page.module.css'

// Loading component
function HelpLoading() {
  return (
    <div className={styles.loading}>
      <Loader size="lg" text="Loading Help..." />
    </div>
  )
}

// Main Help content server component
async function HelpContentWrapper({ slug }: { slug: string }) {
  const [logbook, userRole, contentResult, currentUser] = await Promise.all([
    getLogbookHome(slug),
    getUserRole(slug),
    getLogbookContent(slug, 'help'),
    getCurrentUser()
  ])

  if (!logbook) {
    redirect('/dashboard')
  }

  // If content failed to load, use default Help structure
  const defaultContent = {
    guidelines: {
      visible: true,
      title: "How to Help",
      description: "Ways you can support our growing family",
      cards: [
        {
          id: "1",
          question: "What can I bring when I visit?",
          answer: "Your presence is the best gift! If you'd like to bring something, meals are always appreciated, especially ones that freeze well."
        },
        {
          id: "2",
          question: "How can I help with the baby?",
          answer: "We'd love help with holding the baby while we shower, eat, or just take a moment to rest. Your support means everything!"
        },
        {
          id: "3",
          question: "What about household help?",
          answer: "Light housework like dishes, laundry, or tidying up would be amazing. It helps us focus on bonding with our new baby."
        }
      ]
    },
    registry: {
      visible: true,
      title: "Baby Registry",
      description: "Find the perfect gifts for our little one on our registry.",
      link: {
        url: "https://registry.babylist.com",
        text: "View Registry"
      }
    },
    fivetwentynine: {
      visible: true,
      title: "529 Education Fund",
      description: "Help us save for our baby's future education.",
      link: {
        url: "https://529plan.com",
        text: "Contribute to 529"
      }
    },
    essentials: {
      visible: true,
      title: "Essential Items",
      description: "Everyday items we need for our baby",
      items: [
        {
          id: "1",
          title: "Diapers",
          icon: "circle",
          current: 2,
          max: 10
        },
        {
          id: "2",
          title: "Baby Formula",
          icon: "circle",
          current: 1,
          max: 5
        },
        {
          id: "3",
          title: "Baby Clothes",
          icon: "heart",
          current: 8,
          max: 15
        },
        {
          id: "4",
          title: "Books",
          icon: "archive",
          current: 3,
          max: 10
        },
        {
          id: "5",
          title: "Toys",
          icon: "star",
          current: 5,
          max: 8
        },
        {
          id: "6",
          title: "Blankets",
          icon: "home",
          current: 4,
          max: 6
        }
      ]
    },
    gifts: {
      visible: true,
      title: "Gifts for Parents",
      description: "Little things that always bring us joy",
      parents: [
        {
          name: "Parent 1",
          gifts: [
            { id: "1", title: "Good coffee", icon: "heart" },
            { id: "2", title: "A good book", icon: "archive" },
            { id: "3", title: "Cozy socks", icon: "home" }
          ]
        },
        {
          name: "Parent 2", 
          gifts: [
            { id: "1", title: "Tea collection", icon: "heart" },
            { id: "2", title: "Face masks", icon: "star" },
            { id: "3", title: "Chocolate", icon: "circle" }
          ]
        }
      ]
    },
    occasions: {
      visible: true,
      title: "Special Occasions",
      description: "Important dates and celebrations coming up",
      occasions: [
        {
          id: "1",
          title: "Baby Shower",
          date: "March 15",
          notes: "Celebrating our little one with family and friends"
        },
        {
          id: "2",
          title: "Due Date",
          date: "April 10",
          notes: "Expected arrival of our precious baby"
        }
      ]
    }
  }

  const initialContent = contentResult.success ? contentResult.data || defaultContent : defaultContent

  return (
    <PageTransition>
      <HelpContentUniversal 
        logbook={logbook} 
        userRole={userRole || 'friend'} 
        initialContent={initialContent}
        currentUser={currentUser}
      />
    </PageTransition>
  )
}

// Main page component
export default async function HelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<HelpLoading />}>
      <HelpContentWrapper slug={slug} />
    </Suspense>
  )
}