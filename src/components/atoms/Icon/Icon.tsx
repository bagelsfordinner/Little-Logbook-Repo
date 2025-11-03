'use client'

import { forwardRef } from 'react'
import { 
  Heart, 
  Trash2, 
  Trash,
  Eye, 
  EyeOff, 
  Upload, 
  Download, 
  Check, 
  X, 
  Menu, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  PlusCircle,
  Minus,
  Edit,
  Settings,
  User,
  Users,
  Home,
  Camera,
  Image,
  Video,
  Star,
  Share,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Clock,
  Bell,
  Archive,
  Filter,
  Grid,
  List,
  Square,
  CheckSquare,
  Circle,
  CheckCircle,
  Lock,
  AlertCircle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  BookOpen,
  type LucideProps
} from 'lucide-react'
import styles from './Icon.module.css'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg'

export type IconName = 
  | 'heart'
  | 'trash2'
  | 'trash'
  | 'eye' 
  | 'eye-off'
  | 'upload'
  | 'download'
  | 'check'
  | 'x'
  | 'menu'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'search'
  | 'plus'
  | 'plus-circle'
  | 'minus'
  | 'edit'
  | 'settings'
  | 'user'
  | 'users'
  | 'home'
  | 'camera'
  | 'image'
  | 'video'
  | 'star'
  | 'share'
  | 'copy'
  | 'external-link'
  | 'mail'
  | 'phone'
  | 'calendar'
  | 'clock'
  | 'bell'
  | 'archive'
  | 'filter'
  | 'grid'
  | 'list'
  | 'square'
  | 'check-square'
  | 'circle'
  | 'check-circle'
  | 'lock'
  | 'alert-circle'
  | 'loader'
  | 'refresh-cw'
  | 'alert-triangle'
  | 'help-circle'
  | 'book-open'

interface IconProps {
  name: IconName
  size?: IconSize
  color?: string
  className?: string
}

const iconMap: Record<IconName, React.ComponentType<LucideProps>> = {
  'heart': Heart,
  'trash2': Trash2,
  'trash': Trash,
  'eye': Eye,
  'eye-off': EyeOff,
  'upload': Upload,
  'download': Download,
  'check': Check,
  'x': X,
  'menu': Menu,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'search': Search,
  'plus': Plus,
  'plus-circle': PlusCircle,
  'minus': Minus,
  'edit': Edit,
  'settings': Settings,
  'user': User,
  'users': Users,
  'home': Home,
  'camera': Camera,
  'image': Image,
  'video': Video,
  'star': Star,
  'share': Share,
  'copy': Copy,
  'external-link': ExternalLink,
  'mail': Mail,
  'phone': Phone,
  'calendar': Calendar,
  'clock': Clock,
  'bell': Bell,
  'archive': Archive,
  'filter': Filter,
  'grid': Grid,
  'list': List,
  'square': Square,
  'check-square': CheckSquare,
  'circle': Circle,
  'check-circle': CheckCircle,
  'lock': Lock,
  'alert-circle': AlertCircle,
  'loader': Loader2,
  'refresh-cw': RefreshCw,
  'alert-triangle': AlertTriangle,
  'help-circle': HelpCircle,
  'book-open': BookOpen,
}

const Icon = forwardRef<SVGSVGElement, IconProps>(({
  name,
  size = 'md',
  color,
  className,
  ...props
}, ref) => {
  const IconComponent = iconMap[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`)
    return null
  }

  const iconClass = [
    styles.icon,
    styles[size],
    className
  ].filter(Boolean).join(' ')

  return (
    <IconComponent
      ref={ref}
      className={iconClass}
      style={{ color }}
      {...props}
    />
  )
})

Icon.displayName = 'Icon'

export default Icon