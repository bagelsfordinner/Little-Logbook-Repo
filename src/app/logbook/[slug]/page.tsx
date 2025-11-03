import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLogbookHome, getUserRole, getLogbookStats } from '@/app/actions/logbook'
import { getLogbookContent } from '@/app/actions/universal-content'
import LogbookSkeleton from '@/components/molecules/LogbookSkeleton/LogbookSkeleton'
import { LogbookContentUniversal } from './LogbookContentUniversal'
// styles imported but not used

// Main logbook content server component
async function LogbookContentWrapper({ slug }: { slug: string }) {
  const [logbook, userRole, contentResult, stats] = await Promise.all([
    getLogbookHome(slug),
    getUserRole(slug),
    getLogbookContent(slug, 'home'),
    getLogbookStats(slug)
  ])

  if (!logbook) {
    redirect('/dashboard')
  }

  // If content failed to load, use empty object as fallback
  const initialContent = contentResult.success ? contentResult.data || {} : {}

  return (
    <LogbookContentUniversal 
      logbook={logbook} 
      userRole={userRole || 'friend'} 
      initialContent={initialContent}
      stats={stats}
    />
  )
}

// Main page component
export default async function LogbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<LogbookSkeleton />}>
      <LogbookContentWrapper slug={slug} />
    </Suspense>
  )
}