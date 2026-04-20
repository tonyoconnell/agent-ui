/**
 * useOrgPaths — poll /api/export/paths every 3s, return a Map of edge-key
 * to {strength, resistance, toxic}. Consumed by OrgChart (C2) to color
 * edges by real pheromone instead of hardcoded widths.
 *
 * Edge key convention: `${from}→${to}` (matches substrate edge keys).
 */

import { useEffect, useRef, useState } from 'react'

interface PathRow {
  from: string
  to: string
  strength: number
  resistance: number
  toxic: boolean
}

export interface PathInfo {
  strength: number
  resistance: number
  toxic: boolean
}

const POLL_INTERVAL = 3_000

export function useOrgPaths(): Map<string, PathInfo> {
  const [paths, setPaths] = useState<Map<string, PathInfo>>(new Map())
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true

    const fetchPaths = async () => {
      try {
        const res = await fetch('/api/export/paths')
        if (!res.ok) return
        const data = (await res.json()) as PathRow[]
        if (!aliveRef.current) return
        const map = new Map<string, PathInfo>()
        for (const p of data) {
          map.set(`${p.from}→${p.to}`, {
            strength: p.strength,
            resistance: p.resistance,
            toxic: p.toxic,
          })
        }
        setPaths(map)
      } catch {
        // ignore network errors — keep last known state
      }
    }

    fetchPaths()
    const id = setInterval(fetchPaths, POLL_INTERVAL)

    return () => {
      aliveRef.current = false
      clearInterval(id)
    }
  }, [])

  return paths
}
