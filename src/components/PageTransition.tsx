'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

const pageVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
}

const pageTransition = {
  duration: 0.2
}

export default function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Wrapper for pages that need AnimatePresence
interface PageWrapperProps {
  children: ReactNode
  pathname?: string
  className?: string
}

export function PageWrapper({ children, pathname, className }: PageWrapperProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={pathname} className={className}>
        {children}
      </PageTransition>
    </AnimatePresence>
  )
}