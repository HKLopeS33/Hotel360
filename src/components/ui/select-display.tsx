'use client'

/**
 * Base UI Select renders item labels lazily (only when dropdown is open).
 * This component displays the selected label in the trigger without relying on that mechanism.
 */
import { cn } from '@/lib/utils'

interface SelectDisplayProps {
  value: string | undefined | null
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

export function SelectDisplay({ value, options, placeholder = 'Selecionar...', className }: SelectDisplayProps) {
  const found = options.find(o => o.value === value)
  return (
    <span className={cn('flex flex-1 text-left text-sm truncate', !found && 'text-muted-foreground', className)}>
      {found ? found.label : placeholder}
    </span>
  )
}
