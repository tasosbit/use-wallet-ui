import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { useCallback, useState } from 'react'

import { type AssetLookupInfo, useAssetLookup } from './useAssetLookup'

export interface UseOptInReturn {
  assetIdInput: string
  setAssetIdInput: (value: string) => void
  assetInfo: AssetLookupInfo | null
  assetLookupLoading: boolean
  assetLookupError: string | null
  status: 'idle' | 'signing' | 'sending' | 'success' | 'error'
  error: string | null
  handleOptIn: () => Promise<void>
  reset: () => void
  retry: () => void
}

export function useOptIn(): UseOptInReturn {
  const { activeAddress, algodClient, signTransactions } = useWallet()
  const lookup = useAssetLookup()

  const [status, setStatus] = useState<'idle' | 'signing' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    lookup.reset()
    setStatus('idle')
    setError(null)
  }, [lookup])

  const retry = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  const handleOptIn = useCallback(async () => {
    if (!lookup.assetInfo || !activeAddress || !algodClient) return

    setStatus('signing')
    setError(null)

    try {
      const suggestedParams = await algodClient.getTransactionParams().do()
      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: activeAddress,
        receiver: activeAddress,
        amount: 0,
        assetIndex: lookup.assetInfo.index,
        suggestedParams,
      })

      const signedTxns = await signTransactions([txn.toByte()])
      const signedTxn = signedTxns[0]
      if (!signedTxn) throw new Error('Transaction was not signed')

      setStatus('sending')
      await algodClient.sendRawTransaction(signedTxn).do()
      await algosdk.waitForConfirmation(algodClient, txn.txID(), 4)

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Opt-in failed')
    }
  }, [lookup.assetInfo, activeAddress, algodClient, signTransactions])

  return {
    assetIdInput: lookup.assetIdInput,
    setAssetIdInput: lookup.setAssetIdInput,
    assetInfo: lookup.assetInfo,
    assetLookupLoading: lookup.isLoading,
    assetLookupError: lookup.error,
    status,
    error,
    handleOptIn,
    reset,
    retry,
  }
}
