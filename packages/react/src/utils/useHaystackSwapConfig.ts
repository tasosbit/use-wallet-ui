import { useLayoutEffect, useMemo, useRef } from 'react'
import type algosdk from 'algosdk'
import type { SwapQuoteDisplay } from '@d13co/algo-x-evm-ui'
import { useWallet } from '@txnlab/use-wallet-react'
import type { UseSwapOptions } from '../hooks/useSwap'

type SignTransactions = <T extends algosdk.Transaction[] | Uint8Array[]>(
  txnGroup: T | T[],
  indexesToSign?: number[],
) => Promise<(Uint8Array | null)[]>

/**
 * Structural shape of the router passed to `useHaystackSwapConfig()` /
 * `<WalletUIProvider swapRouter={...}>`. Matches `@txnlab/haystack-router`'s
 * `RouterClient` so consumers can pass one in without this package taking a
 * direct dependency on it. `quote` and `signer` are typed as `any` to stay
 * compatible with the router's concrete types (`FetchQuoteResponse |
 * SwapQuote`, `TransactionSigner | SignerFunction`) under TypeScript's
 * contravariant parameter check.
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

export interface UseHaystackSwapConfigOptions {
  /**
   * Pre-constructed swap router. Typically:
   * `new RouterClient({ apiKey, autoOptIn: true })` from `@txnlab/haystack-router`.
   * Construct it once at module scope and pass it in.
   */
  router: SwapRouterLike
}

/**
 * Pure helper: build the `UseSwapOptions` closure from a router + signer.
 * Shared by `useHaystackSwapConfig` and `WalletUIProvider`'s internal
 * `swapRouter` wiring. No React — callers supply their own `signTransactions`.
 */
export function buildHaystackSwapOptions(
  router: SwapRouterLike,
  signTransactions: SignTransactions,
): UseSwapOptions {
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

/**
 * Build `UseSwapOptions` for `<WalletUIProvider swap={…}>` (and the `useSwap`
 * / `useSwapPanel` hooks) from a Haystack-compatible router. `signTransactions`
 * is read from the surrounding `<WalletProvider>` via `useWallet()`, so this
 * must be called from a component mounted under the provider.
 *
 * Most integrations should pass the router directly to
 * `<WalletUIProvider swapRouter={router}>` and skip this hook. Reach for it
 * only when you need to intercept the signer or consume `UseSwapOptions` in
 * a flow that doesn't go through `WalletUIProvider`.
 *
 * The returned config is stable across renders (only changes when `router`
 * changes); `signTransactions` is read from a ref at call time.
 */
export function useHaystackSwapConfig({ router }: UseHaystackSwapConfigOptions): UseSwapOptions {
  const { signTransactions } = useWallet()
  const signRef = useRef(signTransactions)
  useLayoutEffect(() => {
    signRef.current = signTransactions
  }, [signTransactions])

  return useMemo<UseSwapOptions>(
    () =>
      buildHaystackSwapOptions(router, ((group, indexes) =>
        signRef.current(group, indexes)) as SignTransactions),
    [router],
  )
}
