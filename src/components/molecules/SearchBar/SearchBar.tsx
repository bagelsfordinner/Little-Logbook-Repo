'use client'

import { useState, useEffect } from 'react'
import { Input } from '../../atoms/Input'
import { Button } from '../../atoms/Button'
import styles from './SearchBar.module.css'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  debounceMs?: number
  className?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onClear,
  debounceMs = 300,
  className
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  // Debounced onChange
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange(localValue)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [localValue, onChange, debounceMs])

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleClear = () => {
    setLocalValue('')
    onChange('')
    onClear?.()
  }

  const searchBarClass = [
    styles.searchBar,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={searchBarClass}>
      <div className={styles.inputWrapper}>
        <div className={styles.searchIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21L16.65 16.65" />
          </svg>
        </div>
        <Input
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className={styles.input}
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className={styles.clearButton}
            aria-label="Clear search"
          >
            ×
          </Button>
        )}
      </div>
    </div>
  )
}