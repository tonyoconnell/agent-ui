import { useCallback, useState } from 'react'
import PayService from '../lib/PayService'

export interface UseShortlinkReturn {
  createLink: (payload: string, signature: string) => Promise<string | null>
  shortUrl: string | null
  isLoading: boolean
  error: string | null
}

export function useShortlink(): UseShortlinkReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shortUrl, setShortUrl] = useState<string | null>(null)

  const createLink = useCallback(async (payload: string, signature: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await PayService.createShortlink({
        payload,
        signature,
      })

      if (response.success && response.data) {
        setShortUrl(response.data.shortUrl)
        return response.data.shortUrl
      } else {
        throw new Error(response.error?.message || 'Failed to create shortlink')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Shortlink creation failed')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    createLink,
    shortUrl,
    isLoading,
    error,
  }
}
