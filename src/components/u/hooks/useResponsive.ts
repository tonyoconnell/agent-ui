/**
 * useResponsive - Device detection and responsive utilities
 *
 * Apple-style breakpoints matching iOS design guidelines
 */
import { useEffect, useState } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export interface ResponsiveState {
  device: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  height: number
  isLandscape: boolean
  safeAreaTop: number
  safeAreaBottom: number
}

// Apple-style breakpoints
const BREAKPOINTS = {
  mobile: 428, // iPhone 15 Pro Max width
  tablet: 1024, // iPad Pro 11" in portrait
} as const

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    device: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isLandscape: false,
    safeAreaTop: 0,
    safeAreaBottom: 0,
  })

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isLandscape = width > height

      // Get CSS safe area values (for notched devices)
      const computedStyle = getComputedStyle(document.documentElement)
      const safeAreaTop = parseInt(computedStyle.getPropertyValue('--sat') || '0', 10)
      const safeAreaBottom = parseInt(computedStyle.getPropertyValue('--sab') || '0', 10)

      let device: DeviceType = 'desktop'
      if (width <= BREAKPOINTS.mobile) {
        device = 'mobile'
      } else if (width <= BREAKPOINTS.tablet) {
        device = 'tablet'
      }

      setState({
        device,
        isMobile: device === 'mobile',
        isTablet: device === 'tablet',
        isDesktop: device === 'desktop',
        width,
        height,
        isLandscape,
        safeAreaTop,
        safeAreaBottom,
      })
    }

    updateState()

    // Use ResizeObserver for smoother updates
    const resizeObserver = new ResizeObserver(updateState)
    resizeObserver.observe(document.documentElement)

    // Also listen for orientation changes
    window.addEventListener('orientationchange', updateState)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('orientationchange', updateState)
    }
  }, [])

  return state
}

/**
 * Responsive value helper - returns different values based on device
 */
export function useResponsiveValue<T>(mobile: T, tablet?: T, desktop?: T): T {
  const { device } = useResponsive()

  if (device === 'mobile') return mobile
  if (device === 'tablet') return tablet ?? mobile
  return desktop ?? tablet ?? mobile
}
