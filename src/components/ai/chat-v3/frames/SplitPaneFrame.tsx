import { type ReactNode, useEffect, useRef, useState } from 'react'

interface Props {
  children: ReactNode
  /** Default panel width in px. Persisted to localStorage. */
  defaultWidth?: number
}

const STORAGE_KEY = () =>
  typeof window !== 'undefined' ? `one-chat-split-width-${window.location.hostname}` : 'one-chat-split-width'

/**
 * SplitPaneFrame — sticky right-column mount.
 *
 * Renders as a fixed right-side panel alongside the main page content.
 * Width is user-resizable and persisted per hostname.
 * ⌘/ (or Ctrl+/) toggles visibility.
 */
export function SplitPaneFrame({ children, defaultWidth = 420 }: Props) {
  const [open, setOpen] = useState(true)
  const [width, setWidth] = useState(() => {
    if (typeof window === 'undefined') return defaultWidth
    const stored = localStorage.getItem(STORAGE_KEY())
    return stored ? parseInt(stored, 10) : defaultWidth
  })
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  // ⌘/ or Ctrl+/ toggles the panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    e.preventDefault()
  }

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const delta = startX.current - e.clientX
      const newW = Math.max(280, Math.min(700, startW.current + delta))
      setWidth(newW)
      localStorage.setItem(STORAGE_KEY(), String(newW))
    }
    const onMouseUp = () => {
      dragging.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-40 flex flex-col bg-background border-l border-border shadow-2xl"
      style={{ width }}
    >
      {/* Drag handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/30 transition-colors"
        onMouseDown={onMouseDown}
      />
      <div className="relative flex size-full flex-col overflow-hidden">{children}</div>
    </div>
  )
}
