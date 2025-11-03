import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getLogbookHome, getUserRole } from '@/app/actions/logbook'
import GallerySkeleton from '@/components/molecules/GallerySkeleton/GallerySkeleton'
import { GalleryContentUniversal } from './GalleryContentUniversal'
// styles imported but not used

// Main Gallery content server component
async function GalleryContentWrapper({ slug }: { slug: string }) {
  const [logbook, userRole] = await Promise.all([
    getLogbookHome(slug),
    getUserRole(slug)
  ])

  if (!logbook) {
    redirect('/dashboard')
  }

  return (
    <GalleryContentUniversal 
      logbook={logbook} 
      userRole={userRole || 'friend'} 
    />
  )
}

// Main page component
export default async function GalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<GallerySkeleton />}>
      <GalleryContentWrapper slug={slug} />
    </Suspense>
  )
}