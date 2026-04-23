/**
 * UDashboardWithBoundary — UDashboard wrapped in an error boundary.
 *
 * This thin wrapper is the Astro island entry point for /u.
 * The ErrorBoundary catches render errors, emits a substrate signal,
 * and shows a minimal fallback so the page never goes blank.
 */

import { ErrorBoundary } from "@/components/ErrorBoundary"
import { UDashboard } from "./UDashboard"

export function UDashboardWithBoundary() {
  return (
    <ErrorBoundary surface="u">
      <UDashboard />
    </ErrorBoundary>
  )
}
