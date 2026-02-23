import { useWallet } from '@txnlab/use-wallet-react'
import { useCallback, useEffect, useState } from 'react'

export interface AssetLookupInfo {
  index: number
  name: string
  unitName: string
  decimals: number
}

export interface UseAssetLookupReturn {
  assetIdInput: string
  setAssetIdInput: (value: string) => void
  assetInfo: AssetLookupInfo | null
  isLoading: boolean
  error: string | null
  reset: () => void
}

export function useAssetLookup(options: { enabled?: boolean } = {}): UseAssetLookupReturn {
  const { enabled = true } = options
  const { algodClient } = useWallet()

  const [assetIdInput, setAssetIdInput] = useState('')
  const [assetInfo, setAssetInfo] = useState<AssetLookupInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setAssetIdInput('')
    setAssetInfo(null)
    setIsLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    setAssetInfo(null)
    setError(null)

    const assetId = parseInt(assetIdInput, 10)
    if (!assetIdInput || isNaN(assetId) || assetId <= 0 || !algodClient || !enabled) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const timer = setTimeout(async () => {
      try {
        const result = await algodClient.getAssetByID(assetId).do()
        setAssetInfo({
          index: Number(result.index),
          name: result.params.name || 'Unnamed Asset',
          unitName: result.params.unitName || '',
          decimals: result.params.decimals,
        })
      } catch {
        setError('Asset not found')
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [assetIdInput, algodClient, enabled])

  return { assetIdInput, setAssetIdInput, assetInfo, isLoading, error, reset }
}
