'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type UserRole = 'parent' | 'family' | 'friend' | null

interface EditModeContextType {
  isEditMode: boolean
  toggleEditMode: () => void
  isParent: (userRole: UserRole) => boolean
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined)

interface EditModeProviderProps {
  children: ReactNode
}

export function EditModeProvider({ children }: EditModeProviderProps) {
  const [isEditMode, setIsEditMode] = useState(false)

  const toggleEditMode = () => {
    setIsEditMode(prev => !prev)
  }

  const isParent = (userRole: UserRole): boolean => {
    return userRole === 'parent'
  }

  const value: EditModeContextType = {
    isEditMode,
    toggleEditMode,
    isParent
  }

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  )
}

export function useEditMode(): EditModeContextType {
  const context = useContext(EditModeContext)
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider')
  }
  return context
}