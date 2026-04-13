/**
 * WORLD PAGE WRAPPER — Provides context to all world page components
 *
 * Wraps the entire /world page with SkinProvider so all components
 * (WorldWorkspace, VisitorBanner, GuideNarrator) have access to skin context.
 *
 * Renders children directly (not via Astro slots) because this component is
 * hydrated as `client:only` — Astro slot children aren't passed to the
 * React tree on the client, so we import and render them here.
 */

import WorldWorkspace from '@/components/WorldWorkspace'
import { GuideNarrator } from '@/components/world/GuideNarrator'
import { VisitorBanner } from '@/components/world/VisitorBanner'
import { SkinProvider } from '@/contexts/SkinContext'

interface Props {
  initialSkin?: string
  isAuthenticated?: boolean
}

export function WorldPageWrapper({ initialSkin = 'team', isAuthenticated = false }: Props) {
  return (
    <SkinProvider initialSkin={initialSkin}>
      <VisitorBanner isAuthenticated={isAuthenticated} />
      <WorldWorkspace />
      <GuideNarrator />
    </SkinProvider>
  )
}
