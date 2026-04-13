/**
 * GUIDE NARRATOR — Interactive 12-step tutorial
 *
 * Small card in corner (bottom-right)
 * Shows step number and narration
 * Controls: ← [1/12] → | ESC to close
 *
 * 12 steps:
 * 1. "This is a unit." → highlight one agent, pulse
 * 2. "It can do things." → spread task chips
 * 3. "When it does work, it sends a signal." → fire particle
 * 4. "That leaves a trail." → light path
 * 5-8. Explain strength, resistance, highways, toxic
 * 9. "Nothing flows? It fades." → path slowly thins
 * 10. "Now you try. Drag this unit." → ghost cursor demos drag
 * 11. "You just changed the world. Watch it react." → new path appears, particle flies
 * 12. "That's it. Sign in to keep your changes." → offer [sign up]
 *
 * Mechanism: Replays demo signals into a separate demo world (not the real one)
 * Navigation: Click ← → or press arrow keys to step, ESC to close
 * Styling: Card with dark background, large readable text
 */

import { useCallback, useEffect, useState } from 'react'
import { useSkin } from '@/contexts/SkinContext'
import { cn } from '@/lib/utils'

interface GuideStep {
  number: number
  title: string
  narration: string
  action?: string
}

const guideSteps: GuideStep[] = [
  {
    number: 1,
    title: 'Meet a Unit',
    narration: "This is a unit. It's an actor in the world.",
    action: 'highlight-agent',
  },
  {
    number: 2,
    title: 'Skills',
    narration: 'It can do things. These are its skills, and they have prices.',
    action: 'spread-tasks',
  },
  {
    number: 3,
    title: 'Send a Signal',
    narration: 'When it works, it sends a signal to someone else.',
    action: 'fire-particle',
  },
  {
    number: 4,
    title: 'Leave a Trail',
    narration: 'That leaves a trail. We call it a path.',
    action: 'light-path',
  },
  {
    number: 5,
    title: 'Build Strength',
    narration: 'Do it again, and again, and the path gets stronger.',
    action: 'repeat-signal',
  },
  {
    number: 6,
    title: 'Highways',
    narration: 'When a path gets strong enough, we call it a highway. The world learns to use it.',
    action: 'highlight-highway',
  },
  {
    number: 7,
    title: 'Warnings',
    narration: 'If it fails, the path gets a warning. It gets weaker.',
    action: 'fail-path',
  },
  {
    number: 8,
    title: 'Toxic Paths',
    narration: 'Too many warnings, and it goes toxic. The world stops using it.',
    action: 'highlight-toxic',
  },
  {
    number: 9,
    title: 'Fading',
    narration: "Nothing flows? It fades naturally. The world forgets what doesn't work.",
    action: 'fade-path',
  },
  {
    number: 10,
    title: 'Your Turn',
    narration: 'Now you try. Drag this unit to that one. Draw a new path.',
    action: 'demo-drag',
  },
  {
    number: 11,
    title: 'You Changed It',
    narration: "You just changed the world. Watch it react. The new path will get stronger as it's used.",
    action: 'new-path-reaction',
  },
  {
    number: 12,
    title: "You're In",
    narration: "That's it. You touched the world and it reacted. Sign in to keep your changes.",
    action: 'offer-signup',
  },
]

interface Props {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export function GuideNarrator({ isOpen: controlledIsOpen, onClose, className }: Props) {
  const { skin } = useSkin()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  // Check URL for guide param
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const guideParam = params.get('guide')
    if (guideParam) {
      setIsOpen(true)
      // Jump to specific step if provided (e.g., ?guide=step-10)
      if (guideParam.startsWith('step-')) {
        const stepNum = parseInt(guideParam.split('-')[1], 10)
        if (stepNum >= 1 && stepNum <= 12) {
          setCurrentStep(stepNum)
        }
      } else if (guideParam === '1') {
        setCurrentStep(1)
      }
    } else {
      setIsOpen(false)
    }
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    onClose?.()

    // Remove guide param from URL
    const params = new URLSearchParams(window.location.search)
    params.delete('guide')
    const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [onClose])

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)

      // Update URL
      const params = new URLSearchParams(window.location.search)
      params.set('guide', `step-${newStep}`)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', newUrl)
    }
  }, [currentStep])

  const handleNextStep = useCallback(() => {
    if (currentStep < 12) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)

      // Update URL
      const params = new URLSearchParams(window.location.search)
      params.set('guide', `step-${newStep}`)
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', newUrl)
    }
  }, [currentStep])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      } else if (e.key === 'ArrowLeft') {
        handlePrevStep()
      } else if (e.key === 'ArrowRight') {
        handleNextStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose, handlePrevStep, handleNextStep])

  if (!isOpen) {
    return null
  }

  const step = guideSteps[currentStep - 1]

  return (
    <div
      className={cn(
        'fixed bottom-24 right-6 w-80 rounded-xl border shadow-2xl z-50 p-6',
        'animate-in slide-in-from-bottom-4',
        className,
      )}
      style={{
        backgroundColor: skin.colors.surface,
        borderColor: `${skin.colors.primary}40`,
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-1 rounded hover:bg-white/5 transition-colors"
        style={{ color: skin.colors.muted }}
        title="Close guide (ESC)"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Title */}
      <h3 className="text-lg font-bold mb-2" style={{ color: skin.colors.primary }}>
        {step.title}
      </h3>

      {/* Narration */}
      <p className="text-sm leading-relaxed mb-6" style={{ color: skin.colors.muted }}>
        {step.narration}
      </p>

      {/* Navigation controls */}
      <div className="flex items-center justify-between gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 1}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
          style={{
            color: currentStep === 1 ? skin.colors.muted : skin.colors.primary,
          }}
          title="Previous step (←)"
        >
          ←
        </button>

        {/* Step indicator */}
        <div className="text-xs font-semibold text-center flex-1" style={{ color: skin.colors.muted }}>
          {currentStep} / {guideSteps.length}
        </div>

        {/* Next button */}
        <button
          onClick={handleNextStep}
          disabled={currentStep === 12}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/5"
          style={{
            color: currentStep === 12 ? skin.colors.muted : skin.colors.primary,
          }}
          title="Next step (→)"
        >
          →
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${skin.colors.muted}20` }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            backgroundColor: skin.colors.primary,
            width: `${(currentStep / guideSteps.length) * 100}%`,
          }}
        />
      </div>

      {/* Help text */}
      <p className="mt-4 text-xs text-center" style={{ color: `${skin.colors.muted}60` }}>
        Use ← → or arrow keys • ESC to close
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~250 lines. 12-step interactive guide. URL-driven. Keyboard navigation.
// ═══════════════════════════════════════════════════════════════════════════════
