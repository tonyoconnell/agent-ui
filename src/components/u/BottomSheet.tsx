/**
 * BottomSheet - Apple-style responsive modal
 *
 * - Mobile: Full-screen bottom sheet with drag-to-dismiss
 * - Tablet: Centered sheet (70% width, max-height 85%)
 * - Desktop: Centered dialog (fixed width)
 *
 * Features:
 * - Drag to dismiss on mobile
 * - Backdrop blur
 * - Safe area support
 * - Keyboard avoiding
 */

import { AnimatePresence, motion, type PanInfo, useDragControls } from 'framer-motion'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useResponsive } from './hooks/useResponsive'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  description?: string
  headerGradient?: string
  headerIcon?: ReactNode
  snapPoints?: number[] // Heights as percentages [0.5, 0.9]
  defaultSnap?: number
  enableDrag?: boolean
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  description,
  headerGradient = 'from-primary to-primary/80',
  headerIcon,
  snapPoints = [0.92],
  defaultSnap = 0,
  enableDrag = true,
}: BottomSheetProps) {
  const { isMobile, isTablet, height: screenHeight } = useResponsive()
  const [currentSnap] = useState(defaultSnap)
  const dragControls = useDragControls()
  const sheetRef = useRef<HTMLDivElement>(null)

  const currentSnapHeight = snapPoints[currentSnap] * screenHeight

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open, isMobile])

  const handleDragEnd = (_: any, info: PanInfo) => {
    const velocity = info.velocity.y
    const offset = info.offset.y

    // Fast swipe down = close
    if (velocity > 500) {
      onOpenChange(false)
      return
    }

    // Slow drag - snap to nearest point or close
    if (offset > 100) {
      onOpenChange(false)
    }
  }

  // Desktop/Tablet modal styling
  if (!isMobile) {
    return (
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`
                fixed z-50
                ${
                  isTablet
                    ? 'left-[15%] right-[15%] top-[7.5%] max-h-[85vh]'
                    : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[440px] max-h-[90vh]'
                }
                bg-background rounded-2xl shadow-2xl overflow-hidden
                flex flex-col
              `}
            >
              {/* Header */}
              {(title || headerIcon) && (
                <div className={`relative bg-gradient-to-br ${headerGradient} px-6 pt-6 pb-8`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="relative text-white">
                    <div className="flex items-center gap-4">
                      {headerIcon && (
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          {headerIcon}
                        </div>
                      )}
                      <div>
                        {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
                        {description && <p className="text-white/70 text-sm mt-0.5">{description}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">{children}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    )
  }

  // Mobile bottom sheet
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag={enableDrag ? 'y' : false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            style={{ height: currentSnapHeight }}
            className={`
              fixed inset-x-0 bottom-0 z-50
              bg-background rounded-t-3xl shadow-2xl
              flex flex-col
              touch-none
            `}
          >
            {/* Drag Handle */}
            <div
              className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            {(title || headerIcon) && (
              <div className={`relative bg-gradient-to-br ${headerGradient} px-5 pt-4 pb-6 -mt-1`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <div className="relative text-white">
                  <div className="flex items-center gap-3">
                    {headerIcon && (
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        {headerIcon}
                      </div>
                    )}
                    <div>
                      {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
                      {description && <p className="text-white/70 text-sm">{description}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-safe">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * BottomSheetContent - Content container with proper padding
 */
export function BottomSheetContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>
}

/**
 * BottomSheetFooter - Fixed footer for actions
 */
export function BottomSheetFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`
      px-5 py-4 border-t bg-background/95 backdrop-blur-sm
      pb-safe
      ${className}
    `}
    >
      {children}
    </div>
  )
}
