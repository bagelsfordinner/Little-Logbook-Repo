import { MediaType } from '@/components/molecules/MediaCard'

export interface MockUser {
  name: string
  avatar?: string
  role: 'parent' | 'family' | 'friend'
}

export interface MockLogbook {
  name: string
  slug: string
}

export interface MockMediaItem {
  id: string
  mediaUrl: string
  caption?: string
  mediaType: MediaType
  isOwner: boolean
  createdAt: string
}

export const mockUsers: MockUser[] = [
  {
    name: 'Sarah Johnson',
    avatar: 'https://picsum.photos/100/100?random=1',
    role: 'parent'
  },
  {
    name: 'Mike Johnson',
    avatar: 'https://picsum.photos/100/100?random=2',
    role: 'family'
  },
  {
    name: 'Emma Wilson',
    avatar: 'https://picsum.photos/100/100?random=3',
    role: 'friend'
  }
]

export const mockLogbooks: MockLogbook[] = [
  {
    name: 'Summer Adventures 2024',
    slug: 'summer-adventures-2024'
  },
  {
    name: 'Family Memories',
    slug: 'family-memories'
  },
  {
    name: 'Travel Diary',
    slug: 'travel-diary'
  }
]

export const mockMediaItems: MockMediaItem[] = [
  {
    id: '1',
    mediaUrl: 'https://picsum.photos/400/400?random=10',
    caption: 'Beautiful sunset at the beach during our family vacation',
    mediaType: 'image',
    isOwner: true,
    createdAt: '2024-10-01T10:00:00Z'
  },
  {
    id: '2',
    mediaUrl: 'https://picsum.photos/400/600?random=11',
    caption: 'Kids playing in the sand',
    mediaType: 'image',
    isOwner: false,
    createdAt: '2024-10-01T14:30:00Z'
  },
  {
    id: '3',
    mediaUrl: 'https://picsum.photos/600/400?random=12',
    caption: 'Family barbecue in the backyard - so much fun!',
    mediaType: 'video',
    isOwner: true,
    createdAt: '2024-10-02T18:00:00Z'
  },
  {
    id: '4',
    mediaUrl: 'https://picsum.photos/400/500?random=13',
    caption: 'First day of school photo',
    mediaType: 'image',
    isOwner: true,
    createdAt: '2024-09-05T08:00:00Z'
  },
  {
    id: '5',
    mediaUrl: 'https://picsum.photos/500/400?random=14',
    caption: 'Morning hike through the forest trail',
    mediaType: 'image',
    isOwner: false,
    createdAt: '2024-09-15T07:30:00Z'
  },
  {
    id: '6',
    mediaUrl: 'https://picsum.photos/400/400?random=15',
    caption: 'Birthday party celebration with friends and family',
    mediaType: 'video',
    isOwner: true,
    createdAt: '2024-09-20T16:00:00Z'
  },
  {
    id: '7',
    mediaUrl: 'https://picsum.photos/600/400?random=16',
    caption: 'Weekend camping trip under the stars',
    mediaType: 'image',
    isOwner: false,
    createdAt: '2024-08-25T21:00:00Z'
  },
  {
    id: '8',
    mediaUrl: 'https://picsum.photos/400/600?random=17',
    caption: 'Cooking together in the kitchen',
    mediaType: 'image',
    isOwner: true,
    createdAt: '2024-08-30T12:00:00Z'
  },
  {
    id: '9',
    mediaUrl: 'https://picsum.photos/500/500?random=18',
    caption: 'Soccer game highlights from last weekend',
    mediaType: 'video',
    isOwner: false,
    createdAt: '2024-09-10T15:30:00Z'
  },
  {
    id: '10',
    mediaUrl: 'https://picsum.photos/400/400?random=19',
    caption: 'Garden flowers in full bloom this spring',
    mediaType: 'image',
    isOwner: true,
    createdAt: '2024-04-15T09:00:00Z'
  }
]

// Helper functions
export const getRandomUser = (): MockUser => {
  return mockUsers[Math.floor(Math.random() * mockUsers.length)]
}

export const getRandomLogbook = (): MockLogbook => {
  return mockLogbooks[Math.floor(Math.random() * mockLogbooks.length)]
}

export const getMediaByType = (type: MediaType): MockMediaItem[] => {
  return mockMediaItems.filter(item => item.mediaType === type)
}

export const searchMedia = (query: string): MockMediaItem[] => {
  if (!query.trim()) return mockMediaItems
  
  return mockMediaItems.filter(item => 
    item.caption?.toLowerCase().includes(query.toLowerCase())
  )
}

export const getRecentMedia = (days: number = 30): MockMediaItem[] => {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  return mockMediaItems.filter(item => 
    new Date(item.createdAt) >= cutoffDate
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}