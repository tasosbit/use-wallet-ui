import type algosdk from 'algosdk'
import type { SwapQuoteDisplay } from '@d13co/algo-x-evm-ui'
import type { UseSwapOptions } from '../hooks/useSwap'

type SignTransactions = <T extends algosdk.Transaction[] | Uint8Array[]>(
  txnGroup: T | T[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>

/**
 * Structural shape of the router passed to `getSwapConfig()`. Matches
 * `@txnlab/haystack-router`'s `RouterClient` so consumers can pass one in
 * without this package taking a direct dependency on it. `quote` and `signer`
 * are typed as `any` to stay compatible with the router's concrete types
 * (`FetchQuoteResponse | SwapQuote`, `TransactionSigner | SignerFunction`)
 * under TypeScript's contravariant parameter check.
 */
export interface SwapRouterLike {
  newQuote(params: {
    fromASAID: number
    toASAID: number
    amount: bigint
    address: string
  }): Promise<SwapQuoteDisplay>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newSwap(config: {
    quote: any
    address: string
    slippage: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer: any
    note?: Uint8Array
  }): Promise<{
    execute: (waitRounds?: number) => Promise<{ confirmedRound: bigint; txIds: string[] }>
  }>
}

export interface GetSwapConfigOptions {
  /**
   * Pre-constructed swap router. Typically:
   * `new RouterClient({ apiKey, autoOptIn: true })` from `@txnlab/haystack-router`.
   * Construct it once at module scope and pass it in.
   */
  router: SwapRouterLike
  /**
   * `signTransactions` from `useWallet()`. Nulls are filtered out before the
   * router receives the signed group.
   */
  signTransactions: SignTransactions
}

/**
 * Build `UseSwapOptions` for `<WalletUIProvider swap={…}>` (and the `useSwap`
 * / `useSwapPanel` hooks) from a Haystack-compatible router plus the
 * connected wallet's signer.
 *
 * ```tsx
 * const router = new RouterClient({ apiKey, autoOptIn: true })
 *
 * function WalletUIWithSwap({ children }) {
 *   const { signTransactions } = useWallet()
 *   const swap = useMemo(
 *     () => getSwapConfig({ router, signTransactions }),
 *     [signTransactions],
 *   )
 *   return <WalletUIProvider swap={swap}>{children}</WalletUIProvider>
 * }
 * ```
 */
export function getSwapConfig({ router, signTransactions }: GetSwapConfigOptions): UseSwapOptions {
  return {
    fetchQuote: (params) => router.newQuote(params),
    executeSwap: async ({ onSigned, quote, address, slippage }) => {
      const wrappedSigner = async (
        txnGroup: algosdk.Transaction[],
        indexesToSign: number[],
      ): Promise<Uint8Array[]> => {
        const signed = await signTransactions(txnGroup, indexesToSign)
        const result = signed.filter((s): s is Uint8Array => s != null)
        // Fire onSigned the moment the wallet returns so the panel transitions
        // from "signing" to "sending" before submit + confirmation.
        onSigned?.()
        return result
      }
      const swap = await router.newSwap({
        quote,
        address,
        slippage,
        signer: wrappedSigner,
      })
      return swap.execute()
    },
  }
}
