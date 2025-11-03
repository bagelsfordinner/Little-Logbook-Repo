/**
 * Utility functions for downloading files and creating zip archives
 */

export interface DownloadableImage {
  id: string
  file_url: string
  original_filename: string
}

/**
 * Download a single file
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the object URL
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error('Download failed:', error)
    throw error
  }
}

/**
 * Create and download a zip file containing multiple images
 */
export async function downloadAsZip(
  images: DownloadableImage[], 
  zipFilename: string
): Promise<void> {
  try {
    // Dynamically import JSZip to avoid bundle size issues
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    
    console.log('📦 [DOWNLOAD] Creating zip with', images.length, 'images')
    
    // Download all images and add them to the zip
    const downloadPromises = images.map(async (image, index) => {
      try {
        console.log(`📥 [DOWNLOAD] Fetching image ${index + 1}/${images.length}:`, image.original_filename)
        const response = await fetch(image.file_url)
        if (!response.ok) {
          throw new Error(`Failed to fetch ${image.file_url}: ${response.statusText}`)
        }
        
        const blob = await response.blob()
        const filename = image.original_filename || `image_${image.id}.jpg`
        zip.file(filename, blob)
        console.log(`✅ [DOWNLOAD] Added to zip:`, filename)
      } catch (error) {
        console.error(`❌ [DOWNLOAD] Failed to download ${image.original_filename}:`, error)
        // Continue with other images even if one fails
      }
    })
    
    await Promise.all(downloadPromises)
    
    console.log('🗜️ [DOWNLOAD] Generating zip file...')
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    // Trigger download
    const downloadUrl = window.URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = zipFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl)
    console.log('✅ [DOWNLOAD] Zip download complete:', zipFilename)
    
  } catch (error) {
    console.error('💥 [DOWNLOAD] Zip creation failed:', error)
    throw error
  }
}

/**
 * Generate a filename for bulk downloads
 */
export function generateBulkDownloadFilename(
  logbookName: string,
  downloaderName: string,
  imageCount: number
): string {
  const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const sanitizedLogbook = logbookName.replace(/[^a-zA-Z0-9]/g, '_')
  const sanitizedDownloader = downloaderName.replace(/[^a-zA-Z0-9]/g, '_')
  
  return `${sanitizedLogbook}_${sanitizedDownloader}_${imageCount}images_${date}.zip`
}