/**
 * WORLD PAGE WRAPPER — Provides context to all world page components
 *
 * Wraps the entire /world page with SkinProvider so all components
 * (WorldWorkspace, VisitorBanner, GuideNarrator) have access to skin context
 */

import type { ReactNode } from "react"
import { SkinProvider } from "@/contexts/SkinContext"

interface Props {
  children: ReactNode
  initialSkin?: string
}

export function WorldPageWrapper({ children, initialSkin = "team" }: Props) {
  return (
    <SkinProvider initialSkin={initialSkin}>
      {children}
    </SkinProvider>
  )
}
