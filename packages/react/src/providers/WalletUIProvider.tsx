import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query'
import { useWallet, useNetwork } from '@txnlab/use-wallet-react'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'

import {
  useResolvedTheme,
  type Theme,
  type ResolvedTheme,
} from '../hooks/useResolvedTheme'

import type { NfdLookupResponse, NfdView } from '../hooks/useNfd'

// CSS custom properties for theming - injected via JavaScript to avoid requiring CSS imports
const THEME_STYLES_ID = 'wallet-ui-theme-styles'

const lightThemeVars = `
  --wui-color-primary: #2d2df1;
  --wui-color-primary-hover: #2929d9;
  --wui-color-primary-text: #ffffff;
  --wui-color-bg: #ffffff;
  --wui-color-bg-secondary: #f9fafb;
  --wui-color-bg-tertiary: #f3f4f6;
  --wui-color-bg-hover: #e9e9fd;
  --wui-color-text: #1f2937;
  --wui-color-text-secondary: #6b7280;
  --wui-color-text-tertiary: #9ca3af;
  --wui-color-border: #e5e7eb;
  --wui-color-link: rgba(45, 45, 241, 0.8);
  --wui-color-link-hover: #2d2df1;
  --wui-color-overlay: rgba(0, 0, 0, 0.3);
  --wui-color-danger-bg: #fee2e2;
  --wui-color-danger-bg-hover: #fecaca;
  --wui-color-danger-text: #b91c1c;
  --wui-color-avatar-bg: #e5e7eb;
  --wui-color-avatar-icon: #9ca3af;
`

const darkThemeVars = `
  --wui-color-primary: #bfbff9;
  --wui-color-primary-hover: #d4d4fa;
  --wui-color-primary-text: #001324;
  --wui-color-bg: #001324;
  --wui-color-bg-secondary: #101b29;
  --wui-color-bg-tertiary: #192a39;
  --wui-color-bg-hover: #192a39;
  --wui-color-text: #e9e9fd;
  --wui-color-text-secondary: #99a1a7;
  --wui-color-text-tertiary: #6b7280;
  --wui-color-border: #192a39;
  --wui-color-link: #6c6cf1;
  --wui-color-link-hover: #8080f3;
  --wui-color-overlay: rgba(0, 0, 0, 0.5);
  --wui-color-danger-bg: rgba(127, 29, 29, 0.4);
  --wui-color-danger-bg-hover: rgba(127, 29, 29, 0.6);
  --wui-color-danger-text: #fca5a5;
  --wui-color-avatar-bg: #192a39;
  --wui-color-avatar-icon: #6b7280;
`

function injectThemeStyles() {
  // Only inject once
  if (document.getElementById(THEME_STYLES_ID)) {
    return
  }

  const styleElement = document.createElement('style')
  styleElement.id = THEME_STYLES_ID
  styleElement.textContent = `
    /* Light mode (default) */
    [data-wallet-theme] {
      ${lightThemeVars}
    }

    /* Dark mode via data-theme attribute (explicit) */
    [data-wallet-theme][data-theme='dark'] {
      ${darkThemeVars}
    }

    /* Dark mode via .dark class on ancestor (Tailwind convention) */
    .dark [data-wallet-theme]:not([data-theme='light']) {
      ${darkThemeVars}
    }

    /* Dark mode via system preference (when theme="system" or no explicit theme) */
    @media (prefers-color-scheme: dark) {
      [data-wallet-theme]:not([data-theme='light']):not([data-theme='dark']) {
        ${darkThemeVars}
      }
    }
  `
  document.head.appendChild(styleElement)
}

interface WalletUIContextType {
  queryClient: QueryClient
  theme: Theme
  resolvedTheme: ResolvedTheme
}

interface WalletUIProviderProps {
  children: ReactNode
  queryClient?: QueryClient
  /**
   * Whether to automatically prefetch data for all accounts in connected wallets (defaults to true)
   */
  enablePrefetching?: boolean
  /**
   * NFD view type for prefetching (defaults to 'thumbnail')
   */
  prefetchNfdView?: NfdView
  /**
   * Theme setting for wallet UI components.
   * - 'light': Always use light mode
   * - 'dark': Always use dark mode
   * - 'system': Follow the user's OS/browser preference (default)
   *
   * The library also respects the `.dark` class on ancestor elements (Tailwind convention),
   * which will enable dark mode unless explicitly overridden with theme="light".
   */
  theme?: Theme
}

// Default query client configuration for NFD queries
const createDefaultQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 60 * 60 * 1000, // 1 hour
        refetchOnWindowFocus: true,
        refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
        retry: (failureCount, error) => {
          // Don't retry for 404 errors (not found)
          if (error instanceof Error && error.message.includes('404')) {
            return false
          }
          // For other errors, retry up to 3 times
          return failureCount < 3
        },
      },
    },
  })

const WalletUIContext = createContext<WalletUIContextType | undefined>(
  undefined,
)

// Internal function to prefetch all account data when a wallet connects
function WalletAccountsPrefetcher({
  enabled,
  nfdView,
}: {
  enabled: boolean
  nfdView: NfdView
}) {
  const queryClient = useQueryClient()
  const { activeAddress, activeWallet, algodClient } = useWallet()
  const { activeNetwork } = useNetwork()

  // Previous activeAddress value
  const prevActiveAddressRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip if prefetching is disabled
    if (!enabled) {
      prevActiveAddressRef.current = activeAddress
      return
    }

    // Only prefetch when transitioning from disconnected to connected state
    // (when prevActiveAddress was null but activeAddress is now defined)
    const shouldPrefetch =
      prevActiveAddressRef.current === null &&
      activeAddress !== null &&
      activeWallet !== null &&
      activeWallet.accounts !== undefined &&
      activeWallet.accounts.length > 0 &&
      algodClient !== undefined

    // Always update the previous address ref
    prevActiveAddressRef.current = activeAddress

    // If we don't need to prefetch, exit early
    if (!shouldPrefetch) {
      return
    }

    console.log(
      `[WalletUI] Prefetching data for all accounts in wallet ${activeWallet!.id}`,
    )

    // Get all addresses from the wallet
    const addresses = activeWallet!.accounts.map((account) => account.address)

    // If we have addresses, fetch NFDs in batches of 20
    if (addresses.length > 0) {
      // Process addresses in batches of 20 (NFD API limit)
      const batchSize = 20
      const addressBatches = []

      for (let i = 0; i < addresses.length; i += batchSize) {
        addressBatches.push(addresses.slice(i, i + batchSize))
      }

      // Process each batch
      addressBatches.forEach(async (batch) => {
        // Determine the API endpoint based on the network
        const isTestnet = activeNetwork === 'testnet'
        const apiEndpoint = isTestnet
          ? 'https://api.testnet.nf.domains'
          : 'https://api.nf.domains'

        // Build the query URL with multiple address parameters
        const queryParams = new URLSearchParams()
        batch.forEach((address) => {
          queryParams.append('address', address)
        })
        queryParams.append('view', nfdView)

        try {
          // Make a single request for all addresses in the batch
          const response = await fetch(
            `${apiEndpoint}/nfd/lookup?${queryParams.toString()}`,
            {
              method: 'GET',
              headers: {
                Accept: 'application/json',
              },
            },
          )

          // Handle response
          if (!response.ok && response.status !== 404) {
            throw new Error(
              `NFD prefetch lookup failed: ${response.statusText}`,
            )
          }

          // If we get a 404 or success, process the response
          // For 404, we'll get an empty object
          const responseData: NfdLookupResponse =
            response.status === 404 ? {} : await response.json()

          // For each address in the batch, seed the query cache
          batch.forEach((address) => {
            const nfdData = responseData[address] || null

            // Seed the cache with this NFD data
            queryClient.setQueryData(
              ['nfd', address, activeNetwork, nfdView],
              nfdData,
            )
          })
        } catch (error) {
          console.error('Error prefetching NFD data:', error)
        }
      })
    }

    // For each account in the wallet, prefetch balance data
    addresses.forEach((address) => {
      // Prefetch balance data
      queryClient.prefetchQuery({
        queryKey: ['account-balance', address],
        queryFn: async () => {
          try {
            const accountInfo = await algodClient!
              .accountInformation(address)
              .do()
            return Number(accountInfo.amount)
          } catch (error) {
            throw new Error(`Error fetching account balance: ${error}`)
          }
        },
      })
    })
  }, [
    activeAddress,
    activeWallet,
    activeNetwork,
    nfdView,
    algodClient,
    queryClient,
    enabled,
  ])

  // Return null since this is a utility component with no UI
  return null
}

/**
 * Provider that enables wallet UI components to work with TanStack Query.
 * It can use an existing QueryClient from the parent application or create its own.
 * Also creates a QueryClientProvider if none exists in the parent tree.
 *
 * Automatically prefetches data for all accounts in connected wallets for smoother
 * account switching experience.
 *
 * Supports theme configuration via the `theme` prop:
 * - 'light': Always use light mode
 * - 'dark': Always use dark mode
 * - 'system': Follow the user's OS/browser preference (default)
 */
export function WalletUIProvider({
  children,
  queryClient: externalQueryClient,
  enablePrefetching = true,
  prefetchNfdView = 'thumbnail',
  theme = 'system',
}: WalletUIProviderProps) {
  // Use provided query client or create a default one
  const queryClient = useMemo(
    () => externalQueryClient || createDefaultQueryClient(),
    [externalQueryClient],
  )

  // Resolve the theme (handles 'system' preference detection)
  const resolvedTheme = useResolvedTheme(theme)

  // Inject theme CSS variables on mount
  useEffect(() => {
    injectThemeStyles()
  }, [])

  const contextValue = useMemo(
    () => ({
      queryClient,
      theme,
      resolvedTheme,
    }),
    [queryClient, theme, resolvedTheme],
  )

  // Determine the data-theme attribute value
  // - For explicit 'light' or 'dark', set the attribute to enable CSS variable overrides
  // - For 'system', don't set the attribute so CSS media queries handle it
  const dataTheme = theme === 'system' ? undefined : theme

  const content = (
    <WalletUIContext.Provider value={contextValue}>
      <div data-wallet-theme data-theme={dataTheme}>
        {/* Internal prefetcher component that runs automatically */}
        <WalletAccountsPrefetcher
          enabled={enablePrefetching}
          nfdView={prefetchNfdView}
        />
        {children}
      </div>
    </WalletUIContext.Provider>
  )

  // If no external query client was provided, wrap with our own QueryClientProvider
  if (!externalQueryClient) {
    return (
      <QueryClientProvider client={queryClient}>{content}</QueryClientProvider>
    )
  }

  // Otherwise just return the context provider
  return content
}

/**
 * Hook to access the WalletUI context
 * @throws Error if used outside of WalletUIProvider
 */
export function useWalletUI(): WalletUIContextType {
  const context = useContext(WalletUIContext)
  if (context === undefined) {
    throw new Error('useWalletUI must be used within a WalletUIProvider')
  }
  return context
}
