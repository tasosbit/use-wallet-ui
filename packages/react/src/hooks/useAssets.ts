import { useQueries } from '@tanstack/react-query'
import { useWallet } from '@txnlab/use-wallet-react'
import { useMemo } from 'react'

export interface AssetInfo {
  decimals: number
  unitName: string
}

export function useAssets(assetIds: string[]): {
  loading: boolean
  assets: Record<string, AssetInfo>
} {
  const { algodClient } = useWallet()

  const results = useQueries({
    queries: assetIds.map((id) => ({
      queryKey: ['asset', id],
      queryFn: async (): Promise<AssetInfo> => {
        const result = await algodClient!.getAssetByID(Number(id)).do()
        return {
          decimals: result.params.decimals,
          unitName: result.params.unitName || '',
        }
      },
      retries: 0,
      enabled: !!algodClient,
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const loading = results.some((r) => r.isLoading)

  const assets = useMemo(() => {
    const map: Record<string, AssetInfo> = {}
    for (let i = 0; i < assetIds.length; i++) {
      const data = results[i]?.data
      if (data) {
        map[assetIds[i]] = data
      }
    }
    return map
  }, [assetIds, results])

  return { loading, assets }
}
