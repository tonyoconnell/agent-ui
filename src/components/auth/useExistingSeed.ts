import { useCallback, useEffect, useState } from 'react'

export type SeedMode = 'wrap' | 'sweep' | 'pending' | 'none'

export interface UseExistingSeedResult {
  seed: Uint8Array | null
  mode: SeedMode
  bind: (door: 'passkey' | 'google' | 'magic-link' | 'wallet' | 'passkey-return') => Promise<void>
}

const IDB_STORE = 'vault'
const IDB_KEY = 'master'

async function readIdbSeed(): Promise<Uint8Array | null> {
  if (typeof indexedDB === 'undefined') return null
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_STORE, 1)
      req.onerror = () => resolve(null)
      req.onsuccess = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('vault')) {
          db.close()
          resolve(null)
          return
        }
        const tx = db.transaction('vault', 'readonly')
        const store = tx.objectStore('vault')
        const getReq = store.get(IDB_KEY)
        getReq.onsuccess = () => {
          db.close()
          const val = getReq.result
          if (val instanceof Uint8Array) resolve(val)
          else if (val instanceof ArrayBuffer) resolve(new Uint8Array(val))
          else resolve(null)
        }
        getReq.onerror = () => {
          db.close()
          resolve(null)
        }
      }
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('vault')) db.createObjectStore('vault')
      }
    } catch {
      resolve(null)
    }
  })
}

function modeForDoor(door: Parameters<UseExistingSeedResult['bind']>[0], hasSeed: boolean): SeedMode {
  if (!hasSeed) return 'none'
  if (door === 'passkey' || door === 'passkey-return') return 'wrap'
  if (door === 'wallet') return 'sweep'
  return 'pending'
}

export function useExistingSeed(): UseExistingSeedResult {
  const [seed, setSeed] = useState<Uint8Array | null>(null)
  const [mode, setMode] = useState<SeedMode>('none')

  useEffect(() => {
    readIdbSeed().then((s) => {
      setSeed(s)
      setMode(s ? 'pending' : 'none')
    })
  }, [])

  const bind = useCallback(async (door: Parameters<UseExistingSeedResult['bind']>[0]) => {
    const currentSeed = await readIdbSeed()
    const m = modeForDoor(door, !!currentSeed)
    setMode(m)
    // Actual wrapping (passkey) and sweeping (wallet) are handled by their
    // respective door components after bind() is called. This hook only
    // signals the intent; the door component performs the actual operation.
    // For 'pending' doors (google, magic-link): seed stays in IDB until
    // the user enrolls a passkey on the next page.
  }, [])

  return { seed, mode, bind }
}
