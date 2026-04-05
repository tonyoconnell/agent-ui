/**
 * METAPHOR CONTEXT — Switch lenses on the same reality
 *
 * The ontology is ONE. The views are many.
 *
 * Usage:
 *   const { skin, setSkin, t } = useMetaphor()
 *   t('actor')  // Returns "ant" | "neuron" | "agent" etc.
 *   skin.colors.primary  // Returns the primary color
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { skins, defaultSkin, type MetaphorSkin } from "@/skins"

interface MetaphorContextType {
  skin: MetaphorSkin
  skinId: string
  setSkin: (id: string) => void
  t: (key: keyof MetaphorSkin) => string
  allSkins: typeof skins
}

const MetaphorContext = createContext<MetaphorContextType | null>(null)

export function MetaphorProvider({ children, initialSkin = "team" }: { children: ReactNode; initialSkin?: string }) {
  const [skinId, setSkinId] = useState(initialSkin)
  const skin = skins[skinId] || defaultSkin

  const setSkin = useCallback((id: string) => {
    if (skins[id]) {
      setSkinId(id)
      // Persist preference
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("metaphor-skin", id)
      }
    }
  }, [])

  // Translate a key to the current skin's term
  const t = useCallback(
    (key: keyof MetaphorSkin): string => {
      const value = skin[key]
      return typeof value === "string" ? value : key
    },
    [skin]
  )

  return (
    <MetaphorContext.Provider value={{ skin, skinId, setSkin, t, allSkins: skins }}>
      {children}
    </MetaphorContext.Provider>
  )
}

export function useMetaphor() {
  const context = useContext(MetaphorContext)
  if (!context) {
    throw new Error("useMetaphor must be used within a MetaphorProvider")
  }
  return context
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~50 lines. Context for metaphors.
// ═══════════════════════════════════════════════════════════════════════════════
