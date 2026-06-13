'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoCarouselProps {
  photos: string[]
  emptyLabel?: string
  onRemove?: (index: number) => void
  className?: string
}

export function PhotoCarousel({ photos, emptyLabel = 'Sem fotos', onRemove, className }: PhotoCarouselProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (photos.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg px-3 py-4', className)}>
        <ImageOff className="h-4 w-4" />
        {emptyLabel}
      </div>
    )
  }

  return (
    <>
      <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
        {photos.map((url, i) => (
          <div key={url} className="relative shrink-0 group">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block h-20 w-28 rounded-lg overflow-hidden border border-slate-200 relative"
            >
              <Image src={url} alt="" fill sizes="112px" className="object-cover" />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <Dialog open={openIndex != null} onOpenChange={(o) => { if (!o) setOpenIndex(null) }}>
        <DialogContent className="max-w-2xl p-2 sm:max-w-2xl">
          {openIndex != null && (
            <div className="relative w-full h-[60vh]">
              <Image src={photos[openIndex]} alt="" fill sizes="100vw" className="object-contain" />
              {photos.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80"
                    onClick={() => setOpenIndex(i => (i! - 1 + photos.length) % photos.length)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80"
                    onClick={() => setOpenIndex(i => (i! + 1) % photos.length)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
