import { type ReactNode, useEffect, useRef } from 'react'
import { WagmiProvider } from 'wagmi'
import { reconnect } from '@wagmi/core'
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, lightTheme, darkTheme } from '@rainbow-me/rainbowkit'
import { RainbowKitBridge, type RainbowKitBridgeState, type WagmiConfig } from './RainbowKitBridge'
import type { ResolvedTheme } from '../hooks/useResolvedTheme'

/**
 * Perform a one-time reconnect on mount then patch every connector so that
 * subsequent reconnecting-mode `connect()` calls (isReconnecting: true) are
 * no-ops. This prevents wagmi's internal reconnect cycles — triggered by
 * WalletConnect relay reconnections when switching apps on mobile — from
 * disrupting pending RPC calls like `eth_signTypedData_v4`.
 */
function useOneTimeReconnect(wagmiConfig: WagmiConfig) {
  const patched = useRef(false)

  useEffect(() => {
    if (patched.current) return
    patched.current = true

    // Do the initial reconnect to restore persisted sessions, then lock
    // every connector so that future reconnecting-mode connect() calls are
    // swallowed.  Normal (non-reconnecting) connect() calls are unaffected.
    reconnect(wagmiConfig).finally(() => {
      for (const connector of wagmiConfig.connectors) {
        const originalConnect = connector.connect.bind(connector)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connector.connect = async (params?: any) => {
          if (params?.isReconnecting) {
            console.log(`[wagmi] suppressing reconnect for connector "${connector.name}"`)
            // Return a minimal result so wagmi doesn't throw.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { accounts: [] as any, chainId: wagmiConfig.chains[0]?.id ?? 1 }
          }
          return originalConnect(params)
        }
      }
    })
  }, [wagmiConfig])
}

/**
 * Create a bound Provider component for use by WalletUIProvider.
 * Called once by `createRainbowKitConfig` — the returned component captures
 * `wagmiConfig` and `bridgeState` in closure so WalletUIProvider only needs
 * to pass `queryClient`, `resolvedTheme`, `walletManager`, and `children`.
 */
export function createBoundProvider(wagmiConfig: WagmiConfig, bridgeState: RainbowKitBridgeState) {
  return function RainbowKitAutoProvider({
    queryClient,
    resolvedTheme,
    walletManager,
    children,
  }: {
    queryClient: QueryClient
    resolvedTheme: ResolvedTheme
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletManager: any
    children: ReactNode
  }) {
    useOneTimeReconnect(wagmiConfig)

    return (
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={resolvedTheme === 'dark' ? darkTheme() : lightTheme()}>
            <RainbowKitBridge walletManager={walletManager} state={bridgeState} />
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    )
  }
}
