import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLogbookHome, getUserRole } from '@/app/actions/logbook'
import LogbookSkeleton from '@/components/molecules/LogbookSkeleton/LogbookSkeleton'
import { PageTransition } from '@/components/wrappers/PageTransition'
import AdminContentUniversal from './AdminContentUniversal'

// Admin content server component
async function AdminContentWrapper({ slug }: { slug: string }) {
  const [logbook, userRole] = await Promise.all([
    getLogbookHome(slug),
    getUserRole(slug)
  ])

  if (!logbook) {
    redirect('/dashboard')
  }

  return (
    <PageTransition>
      <AdminContentUniversal 
        logbookId={logbook.id} 
        userRole={userRole || 'friend'} 
      />
    </PageTransition>
  )
}

// Main admin page component
export default async function AdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<LogbookSkeleton />}>
      <AdminContentWrapper slug={slug} />
    </Suspense>
  )
}