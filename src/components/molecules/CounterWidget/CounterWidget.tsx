'use client'

import { Button } from '../../atoms/Button'
import styles from './CounterWidget.module.css'

interface CounterWidgetProps {
  label: string
  currentCount: number
  targetCount?: number
  onIncrement: () => void
  onDecrement: () => void
  canEdit: boolean
  className?: string
}

export default function CounterWidget({
  label,
  currentCount,
  targetCount,
  onIncrement,
  onDecrement,
  canEdit,
  className
}: CounterWidgetProps) {
  const progress = targetCount ? Math.min((currentCount / targetCount) * 100, 100) : 0
  const isComplete = targetCount ? currentCount >= targetCount : false

  const widgetClass = [
    styles.widget,
    isComplete && styles.complete,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={widgetClass}>
      <div className={styles.header}>
        <h3 className={styles.label}>{label}</h3>
        <div className={styles.count}>
          {targetCount ? (
            <span className={styles.countText}>
              {currentCount} / {targetCount}
            </span>
          ) : (
            <span className={styles.countText}>{currentCount}</span>
          )}
        </div>
      </div>

      {canEdit && (
        <div className={styles.controls}>
          <Button
            variant="secondary"
            size="sm"
            onClick={onDecrement}
            disabled={currentCount <= 0}
          >
            −
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onIncrement}
          >
            +
          </Button>
        </div>
      )}

      {targetCount && (
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}