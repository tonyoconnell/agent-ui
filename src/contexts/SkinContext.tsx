/**
 * SKIN CONTEXT — Switch lenses on the same reality
 *
 * The ontology is ONE. The views are many.
 *
 * Usage:
 *   const { skin, setSkin, t } = useSkin()
 *   t('actor')  // Returns "ant" | "neuron" | "agent" etc.
 *   skin.colors.primary  // Returns the primary color
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { skins, defaultSkin, type MetaphorSkin } from "@/skins"

interface SkinContextType {
  skin: MetaphorSkin
  skinId: string
  setSkin: (id: string) => void
  t: (key: keyof MetaphorSkin) => string
  allSkins: typeof skins
}

const SkinContext = createContext<SkinContextType | null>(null)

export function SkinProvider({ children, initialSkin = "team" }: { children: ReactNode; initialSkin?: string }) {
  const [skinId, setSkinId] = useState(initialSkin)
  const skin = skins[skinId] || defaultSkin

  const setSkin = useCallback((id: string) => {
    if (skins[id]) {
      setSkinId(id)
      // Persist preference
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("skin", id)
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
    <SkinContext.Provider value={{ skin, skinId, setSkin, t, allSkins: skins }}>
      {children}
    </SkinContext.Provider>
  )
}

export function useSkin() {
  const context = useContext(SkinContext)
  if (!context) {
    throw new Error("useSkin must be used within a SkinProvider")
  }
  return context
}

// ═══════════════════════════════════════════════════════════════════════════════
// ~50 lines. Context for metaphors.
// ═══════════════════════════════════════════════════════════════════════════════
