import { useCallback, useEffect, useState } from 'react'
import PaymentStatusTracker, { type PaymentStatus } from '../lib/PaymentStatusTracker'
import PayService from '../lib/PayService'

export interface UseEscrowReturn {
  createPayment: (amount: string, chain: string, treasury: string) => Promise<string | null>
  paymentStatus: PaymentStatus | null
  isLoading: boolean
  error: string | null
  reset: () => void
}

export function useEscrow(): UseEscrowReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [unsubscribe])

  const createPayment = useCallback(
    async (amount: string, chain: string, treasuryAddress: string): Promise<string | null> => {
      setIsLoading(true)
      setError(null)
      setPaymentStatus(null)

      try {
        // 1. Create Escrow Session
        const response = await PayService.createEscrow({
          chain,
          expectedAmount: amount,
          treasuryAddress,
          expiryMinutes: 60,
        })

        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to create payment session')
        }

        const { paymentId, escrowAddress } = response.data

        // 2. Start Tracking
        const unsub = PaymentStatusTracker.trackPayment(paymentId, 'escrow', chain, (status) =>
          setPaymentStatus(status),
        )

        setUnsubscribe(() => unsub)

        return escrowAddress
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Payment creation failed')
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    if (unsubscribe) unsubscribe()
    setUnsubscribe(null)
    setPaymentStatus(null)
    setError(null)
    setIsLoading(false)
  }, [unsubscribe])

  return {
    createPayment,
    paymentStatus,
    isLoading,
    error,
    reset,
  }
}
