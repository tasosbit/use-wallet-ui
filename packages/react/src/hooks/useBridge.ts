import { useWallet } from '@txnlab/use-wallet-react'
import { useQueryClient } from '@tanstack/react-query'
import algosdk from 'algosdk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  getOrCreateSdk,
  fetchChainDetailsMap,
  getQuote,
  getGasFees,
  getEstimatedTime,
  getExtraGasMaxLimits,
  getTransferStatus,
  fetchEvmTokenBalances,
  type AllbridgeCoreSdk,
  type ChainDetailsWithTokens,
  type TokenWithChainDetails,
  type TransferStatusResponse,
  type NodeRpcUrls,
  type TokenBalanceMap,
} from '../services/bridgeSdk'
import { type EIP1193Provider } from '../services/evmProviderAdapter'
import { switchToEvmChain, switchBackToAlgorand } from '../services/evmChainSwitch'

// -- Public types for the bridge panel --

export interface BridgeChain {
  chainSymbol: string
  chainName: string
  chainId?: string
  tokens: BridgeToken[]
}

export interface BridgeToken {
  symbol: string
  name: string
  decimals: number
  chainSymbol: string
  chainName: string
  /** Raw balance in smallest token units (decimal string). Undefined while loading. */
  balance?: string
}

export type BridgeStatus =
  | 'idle'
  | 'loading-chains'
  | 'quoting'
  | 'approving'
  | 'signing'
  | 'sending'
  | 'opting-in'
  | 'waiting'
  | 'watching-funding'
  | 'opt-in-sent'
  | 'success'
  | 'error'

export interface UseBridgeOptions {
  nodeRpcUrls?: NodeRpcUrls
}

export interface UseBridgeReturn {
  // Availability
  isAvailable: boolean

  // Chain/token selection
  chains: BridgeChain[]
  chainsLoading: boolean
  balancesLoading: boolean
  sourceChain: BridgeChain | null
  setSourceChain: (symbol: string) => void
  sourceToken: BridgeToken | null
  setSourceToken: (symbol: string) => void
  destinationToken: BridgeToken | null
  setDestinationToken: (symbol: string) => void

  // Amount
  amount: string
  setAmount: (v: string) => void
  receivedAmount: string | null
  quoteLoading: boolean

  // Fee
  gasFee: string | null
  gasFeeLoading: boolean
  gasFeeUnit: string | null
  /** Approximate ALGO the user will receive from extra gas conversion (e.g. "~0.123 ALGO") */
  extraGasAlgo: string | null

  // Addresses
  evmAddress: string | null
  algorandAddress: string | null

  // Transfer tracking
  estimatedTimeMs: number | null
  waitingSince: number | null
  transferStatus: TransferStatusResponse | null

  // Opt-in tracking
  optInNeeded: boolean
  optInSigned: boolean
  watchingForFunding: boolean
  optInConfirmed: boolean

  // Transaction status
  status: BridgeStatus
  error: string | null
  sourceTxId: string | null

  // Actions
  handleBridge: () => Promise<void>
  reset: () => void
  retry: () => void
}

// Minimum available balance in microAlgos to perform an opt-in (0.1 MBR + 0.001 fee)
const OPT_IN_COST_MICRO = 101_000

// Available balance threshold (in microAlgos) below which extra gas is requested
// on the destination chain so the user receives ALGO for future transactions.
const LOW_BALANCE_THRESHOLD_MICRO = 100_000

// When the account is below the threshold, request this much extra gas (in USD)
// to be converted to ALGO on the destination chain.
const MAX_EXTRA_GAS_USD = 1

// Convert a float amount string to integer (smallest token units) for ERC-20 approve.
// Avoids floating-point by splitting at the decimal point and padding.
function floatToSmallestUnit(amount: string, decimals: number): string {
  const [whole = '0', frac = ''] = amount.split('.')
  const paddedFrac = frac.padEnd(decimals, '0').slice(0, decimals)
  return BigInt(whole + paddedFrac).toString()
}

// Map Allbridge chain symbols to their native currency ticker for fee display
export function useBridge(options: UseBridgeOptions = {}): UseBridgeReturn {
  const { activeAddress, activeWallet, algodClient, signTransactions } = useWallet()
  const queryClient = useQueryClient()

  // SDK state
  const sdkRef = useRef<AllbridgeCoreSdk | null>(null)
  const [sdkAvailable, setSdkAvailable] = useState<boolean | null>(null)
  const [allChains, setAllChains] = useState<ChainDetailsWithTokens[]>([])
  const [chainsLoading, setChainsLoading] = useState(false)

  // Token balance state
  const [tokenBalances, setTokenBalances] = useState<TokenBalanceMap>({})
  const [balancesLoading, setBalancesLoading] = useState(false)

  // Selection state
  const [selectedSourceChainSymbol, setSelectedSourceChainSymbol] = useState<string | null>(null)
  const [selectedSourceTokenSymbol, setSelectedSourceTokenSymbol] = useState<string | null>(null)
  const [selectedDestTokenSymbol, setSelectedDestTokenSymbol] = useState<string | null>(null)

  // Amount state
  const [amount, setAmount] = useState('')
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  // Fee state
  const [gasFee, setGasFee] = useState<string | null>(null)
  const [gasFeeLoading, setGasFeeLoading] = useState(false)
  // Raw extra gas amount in stablecoin float (e.g. "0.04000000").
  // Mirrored as state (in addition to extraGasRef) so the quote effect can react to changes.
  const [extraGasAmount, setExtraGasAmount] = useState<string | null>(null)
  // Approximate ALGO received from extra gas conversion (e.g. "~0.123 ALGO")
  const [extraGasAlgo, setExtraGasAlgo] = useState<string | null>(null)

  // Transfer state
  const [status, setStatus] = useState<BridgeStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sourceTxId, setSourceTxId] = useState<string | null>(null)
  const [estimatedTimeMs, setEstimatedTimeMs] = useState<number | null>(null)
  const [waitingSince, setWaitingSince] = useState<number | null>(null)
  const [transferStatus, setTransferStatus] = useState<TransferStatusResponse | null>(null)

  // Opt-in state
  const [optInNeeded, setOptInNeeded] = useState(false)
  const [optInSigned, setOptInSigned] = useState(false)
  const [watchingForFunding, setWatchingForFunding] = useState(false)
  const [optInConfirmed, setOptInConfirmed] = useState(false)
  const signedOptInRef = useRef<Uint8Array | null>(null)
  const optInTxIdRef = useRef<string | null>(null)

  // Pre-computed extra gas in stablecoin (float), set by the gas-fee effect.
  // When non-null, handleBridge switches to WITH_STABLECOIN payment and adds
  // the stablecoin fee + extra gas on top of the user's amount.
  const extraGasRef = useRef<string | null>(null)
  // Stablecoin gas fee (int format) — stored when extra gas is active so
  // handleBridge can add it to the transfer amount.
  const stablecoinFeeRef = useRef<{ int: string; float: string } | null>(null)

  // Tracks whether the user has manually selected a source chain (prevents auto-reselection)
  const userHasSelectedChainRef = useRef(false)

  // Abort ref for cleanup
  const abortRef = useRef<AbortController | null>(null)

  // -- Derived values --

  // @ts-ignore - metadata exists on LiquidEvmBaseWallet accounts
  const evmAddress: string | null = (activeWallet?.activeAccount?.metadata?.evmAddress as string) ?? null
  const algorandAddress = activeAddress ?? null
  // @ts-ignore - isLiquid exists on Liquid wallet metadata
  const isLiquidEvm = !!activeWallet?.metadata?.isLiquid

  // Fee display unit — always the source token symbol (e.g. USDC) since fees
  // are inclusive and paid in the source token via stablecoin payment.
  const gasFeeUnit = selectedSourceTokenSymbol ?? null

  // Convert SDK chains to BridgeChain format (EVM chains only, exclude ALG)
  // Attach token balances and sort chains by total balance descending
  const chains: BridgeChain[] = useMemo(() => {
    const mapped = allChains
      .filter((c) => c.chainType === 'EVM')
      .map((c) => {
        const tokens = c.tokens.map((t: TokenWithChainDetails) => {
          const balKey = `${c.chainSymbol}:${t.symbol}`
          const rawBal = tokenBalances[balKey]
          return {
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals,
            chainSymbol: c.chainSymbol,
            chainName: c.name,
            balance: rawBal != null ? rawBal.toString() : undefined,
          }
        })
        return {
          chainSymbol: c.chainSymbol,
          chainName: c.name,
          chainId: c.chainId,
          tokens,
        }
      })

    // Sort by total normalized balance (normalize all tokens to 18 decimals for comparison)
    const hasAnyBalance = Object.keys(tokenBalances).length > 0
    if (hasAnyBalance) {
      mapped.sort((a, b) => {
        const totalA = a.tokens.reduce((sum, t) => {
          const bal = tokenBalances[`${a.chainSymbol}:${t.symbol}`] ?? 0n
          // Normalize: shift to 18 decimals for cross-token comparison
          const normalized = bal * 10n ** BigInt(18 - t.decimals)
          return sum + normalized
        }, 0n)
        const totalB = b.tokens.reduce((sum, t) => {
          const bal = tokenBalances[`${b.chainSymbol}:${t.symbol}`] ?? 0n
          const normalized = bal * 10n ** BigInt(18 - t.decimals)
          return sum + normalized
        }, 0n)
        if (totalB > totalA) return 1
        if (totalB < totalA) return -1
        return 0
      })
    }

    return mapped
  }, [allChains, tokenBalances])

  // Resolve selected SDK tokens
  const sourceChain = chains.find((c) => c.chainSymbol === selectedSourceChainSymbol) ?? null
  const sourceToken = sourceChain?.tokens.find((t) => t.symbol === selectedSourceTokenSymbol) ?? null
  const destinationToken = (() => {
    const algChain = allChains.find((c) => c.chainSymbol === 'ALG')
    if (!algChain) return null
    const t = algChain.tokens.find((t: TokenWithChainDetails) => t.symbol === selectedDestTokenSymbol) ?? algChain.tokens[0]
    if (!t) return null
    return { symbol: t.symbol, name: t.name, decimals: t.decimals, chainSymbol: 'ALG', chainName: algChain.name }
  })()

  // Resolve full SDK TokenWithChainDetails for API calls
  const resolveSourceSdkToken = useCallback((): TokenWithChainDetails | null => {
    if (!selectedSourceChainSymbol || !selectedSourceTokenSymbol) return null
    const chain = allChains.find((c) => c.chainSymbol === selectedSourceChainSymbol)
    return chain?.tokens.find((t: TokenWithChainDetails) => t.symbol === selectedSourceTokenSymbol) ?? null
  }, [allChains, selectedSourceChainSymbol, selectedSourceTokenSymbol])

  const resolveDestSdkToken = useCallback((): TokenWithChainDetails | null => {
    const chain = allChains.find((c) => c.chainSymbol === 'ALG')
    if (!chain) return null
    return chain.tokens.find((t: TokenWithChainDetails) => t.symbol === (selectedDestTokenSymbol ?? '')) ?? chain.tokens[0] ?? null
  }, [allChains, selectedDestTokenSymbol])

  // -- Initialize SDK and load chains --

  useEffect(() => {
    if (!isLiquidEvm) return

    let cancelled = false
    setChainsLoading(true)
    ;(async () => {
      try {
        const sdk = await getOrCreateSdk(options.nodeRpcUrls)
        if (cancelled) return
        sdkRef.current = sdk
        setSdkAvailable(true)
      } catch (err) {
        console.warn('[useBridge] SDK init failed:', err)
        if (!cancelled) setSdkAvailable(false)
      }

      // Fetch chains separately so SDK availability isn't affected by network errors
      const sdk = sdkRef.current
      if (!sdk || cancelled) {
        if (!cancelled) setChainsLoading(false)
        return
      }

      try {
        const chainList = await fetchChainDetailsMap(sdk)
        if (cancelled) return
        setAllChains(chainList)

        // Auto-select first EVM chain and its first token
        const firstEvm = chainList.find((c) => c.chainType === 'EVM')
        if (firstEvm && firstEvm.tokens.length > 0) {
          setSelectedSourceChainSymbol(firstEvm.chainSymbol)
          setSelectedSourceTokenSymbol(firstEvm.tokens[0].symbol)
        }

        // Auto-select first ALG token as destination
        const algChain = chainList.find((c) => c.chainSymbol === 'ALG')
        if (algChain && algChain.tokens.length > 0) {
          setSelectedDestTokenSymbol(algChain.tokens[0].symbol)
        }
      } catch (err) {
        console.warn('[useBridge] Chain fetch failed:', err)
      } finally {
        if (!cancelled) setChainsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLiquidEvm]) // eslint-disable-line react-hooks/exhaustive-deps

  // -- Fetch EVM token balances when evmAddress and chains are available --

  useEffect(() => {
    if (!evmAddress || allChains.length === 0) return

    let cancelled = false
    setBalancesLoading(true)
    ;(async () => {
      try {
        const balances = await fetchEvmTokenBalances(evmAddress, allChains, options.nodeRpcUrls)
        if (cancelled) return
        setTokenBalances(balances)

        // Auto-select the highest-balance chain if the user hasn't manually selected one
        if (!userHasSelectedChainRef.current) {
          const evmChains = allChains.filter((c) => c.chainType === 'EVM')
          let bestChain: ChainDetailsWithTokens | null = null
          let bestTotal = 0n
          for (const chain of evmChains) {
            let total = 0n
            for (const token of chain.tokens) {
              const bal = balances[`${chain.chainSymbol}:${token.symbol}`] ?? 0n
              total += bal * 10n ** BigInt(18 - token.decimals)
            }
            if (total > bestTotal) {
              bestTotal = total
              bestChain = chain
            }
          }
          if (bestChain && bestTotal > 0n) {
            setSelectedSourceChainSymbol(bestChain.chainSymbol)
            setSelectedSourceTokenSymbol(bestChain.tokens[0]?.symbol ?? null)
          }
        }
      } catch (err) {
        console.warn('[useBridge] Balance fetch failed:', err)
      } finally {
        if (!cancelled) setBalancesLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [evmAddress, allChains, options.nodeRpcUrls])

  // -- Fetch gas fees when tokens change --
  // Also checks whether the Algorand account has low balance and pre-computes
  // extra gas (paid in stablecoin, converted to ALGO on the destination chain).

  useEffect(() => {
    const sdk = sdkRef.current
    const src = resolveSourceSdkToken()
    const dst = resolveDestSdkToken()
    if (!sdk || !src || !dst) {
      setGasFee(null)
      extraGasRef.current = null
      setExtraGasAmount(null)
      setExtraGasAlgo(null)
      return
    }

    let cancelled = false
    setGasFeeLoading(true)
    ;(async () => {
      try {
        const { Messenger, FeePaymentMethod } = await import('@allbridge/bridge-core-sdk')

        // Fetch bridge gas fees (both native and stablecoin options)
        const fees = await getGasFees(sdk, src, dst, Messenger.ALLBRIDGE)
        if (cancelled) return
        const nativeFee = fees[FeePaymentMethod.WITH_NATIVE_CURRENCY]?.float ?? null
        const stableFee = fees[FeePaymentMethod.WITH_STABLECOIN]

        // Check whether the Algorand account has low available balance.
        // If below the threshold, include extra gas (paid in stablecoin)
        // so the user receives ALGO for future transactions.
        let extraGasFloat: string | null = null
        let extraGasAlgoValue: string | null = null
        if (algorandAddress && algodClient) {
          let needsExtraGas = false
          try {
            const info = await algodClient.accountInformation(algorandAddress).do()
            const available = Number(info.amount) - Number(info.minBalance)
            needsExtraGas = available < LOW_BALANCE_THRESHOLD_MICRO
          } catch {
            // Network error or account doesn't exist — assume extra gas needed
            needsExtraGas = true
          }

          if (needsExtraGas) {
            try {
              const limits = await getExtraGasMaxLimits(sdk, src, dst, Messenger.ALLBRIDGE)
              if (cancelled) return
              const stablecoinMax = limits.extraGasMax[FeePaymentMethod.WITH_STABLECOIN]
              const maxFloat = parseFloat(stablecoinMax?.float ?? '0')
              if (maxFloat > 0) {
                // Extra gas in stablecoin terms (≈ USD for USDC/USDT).
                // Cap precision to 8 decimal places to avoid BigInt encoding errors.
                const raw = Math.min(MAX_EXTRA_GAS_USD, maxFloat)
                extraGasFloat = raw.toFixed(8)

                // Estimate ALGO received: proportion of max dest gas based on our request
                const gasAmountMaxFloat = parseFloat(limits.destinationChain.gasAmountMax.float ?? '0')
                if (gasAmountMaxFloat > 0) {
                  const algoAmount = (raw / maxFloat) * gasAmountMaxFloat
                  extraGasAlgoValue = `~${algoAmount.toFixed(3)} ALGO`
                }
              }
              console.debug('[useBridge] Extra gas check:', { needsExtraGas, maxFloat, extraGasFloat })
            } catch (err) {
              console.warn('[useBridge] Could not fetch extra gas limits:', err)
            }
          }
        }

        if (cancelled) return

        extraGasRef.current = extraGasFloat
        // Always store the stablecoin fee so handleBridge can use inclusive
        // stablecoin payment (fee deducted from user's amount, not paid in ETH).
        stablecoinFeeRef.current = stableFee
          ? { int: stableFee.int, float: stableFee.float }
          : null
        setExtraGasAmount(extraGasFloat)
        setExtraGasAlgo(extraGasAlgoValue)
        // Always display the stablecoin fee in source token units for
        // consistency with the inclusive fee model.
        setGasFee(stableFee?.float ?? nativeFee)
      } catch (err) {
        console.error('[useBridge] Fee calculation error:', err)
        if (!cancelled) {
          setGasFee(null)
          extraGasRef.current = null
          stablecoinFeeRef.current = null
          setExtraGasAmount(null)
          setExtraGasAlgo(null)
        }
      } finally {
        if (!cancelled) setGasFeeLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resolveSourceSdkToken, resolveDestSdkToken, algorandAddress, algodClient])

  // -- Compute estimated transfer time when tokens change --

  useEffect(() => {
    const sdk = sdkRef.current
    const src = resolveSourceSdkToken()
    const dst = resolveDestSdkToken()
    if (!sdk || !src || !dst) {
      setEstimatedTimeMs(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const { Messenger } = await import('@allbridge/bridge-core-sdk')
        const eta = getEstimatedTime(sdk, src, dst, Messenger.ALLBRIDGE)
        if (!cancelled) setEstimatedTimeMs(eta)
      } catch {
        if (!cancelled) setEstimatedTimeMs(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resolveSourceSdkToken, resolveDestSdkToken])

  // -- Debounced quote calculation --
  // Fees are inclusive: the user's input is the total they spend. In stablecoin mode
  // the SDK deducts fee + extra gas from the amount, so the quote must reflect the
  // net amount that actually gets bridged: amount - gasFee - extraGas.

  useEffect(() => {
    const sdk = sdkRef.current
    const src = resolveSourceSdkToken()
    const dst = resolveDestSdkToken()
    if (!sdk || !src || !dst || !amount || parseFloat(amount) <= 0) {
      setReceivedAmount(null)
      return
    }

    // Fees are inclusive: always subtract stablecoin fee + extra gas from the
    // input so the quote reflects what the user actually receives.
    let quoteAmount = amount
    if (gasFee) {
      const extra = extraGasAmount ? parseFloat(extraGasAmount) : 0
      const net = parseFloat(amount) - parseFloat(gasFee) - extra
      if (net <= 0) {
        setReceivedAmount(null)
        return
      }
      // Cap decimals to source token precision (e.g. 6 for USDC) to avoid
      // Allbridge SDK "decimals cannot be greater than N" errors.
      quoteAmount = parseFloat(net.toFixed(src.decimals)).toString()
    }

    let cancelled = false
    setQuoteLoading(true)

    const timer = setTimeout(async () => {
      try {
        const { Messenger } = await import('@allbridge/bridge-core-sdk')
        const result = await getQuote(sdk, quoteAmount, src, dst, Messenger.ALLBRIDGE)
        if (!cancelled) setReceivedAmount(result)
      } catch (err) {
        console.error('[useBridge] Quote calculation error:', err)
        if (!cancelled) setReceivedAmount(null)
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [amount, gasFee, extraGasAmount, resolveSourceSdkToken, resolveDestSdkToken])

  // -- Transfer status polling --

  useEffect(() => {
    if (status !== 'waiting' || !sourceTxId || !selectedSourceChainSymbol) return
    const sdk = sdkRef.current
    if (!sdk) return

    const controller = new AbortController()
    abortRef.current = controller

    const poll = async () => {
      while (!controller.signal.aborted) {
        try {
          const st = await getTransferStatus(sdk, selectedSourceChainSymbol, sourceTxId)
          if (controller.signal.aborted) return
          setTransferStatus(st)

          const isComplete =
            st.send &&
            st.send.confirmations >= st.send.confirmationsNeeded &&
            st.signaturesCount >= st.signaturesNeeded &&
            st.receive &&
            st.receive.confirmations >= st.receive.confirmationsNeeded

          if (isComplete) {
            setStatus('success')
            queryClient.invalidateQueries({ queryKey: ['account-info'] })
            queryClient.invalidateQueries({ queryKey: ['account-balance'] })
            return
          }
        } catch {
          // Ignore polling errors, keep trying
        }

        // Wait 5 seconds between polls
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, 5000)
          controller.signal.addEventListener('abort', () => {
            clearTimeout(t)
            resolve()
          })
        })
      }
    }

    poll()
    return () => controller.abort()
  }, [status, sourceTxId, selectedSourceChainSymbol])

  // -- Cleanup: switch back to Algorand chain on unmount --

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (activeWallet && isLiquidEvm) {
        const getProvider = (activeWallet as unknown as Record<string, unknown>).getEvmProvider as
          | (() => Promise<EIP1193Provider>)
          | undefined
        if (getProvider) {
          getProvider()
            .then((p) => switchBackToAlgorand(p))
            .catch(() => {})
        }
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // -- Actions --

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setAmount('')
    setReceivedAmount(null)
    setStatus('idle')
    setError(null)
    setSourceTxId(null)
    setTransferStatus(null)
    setEstimatedTimeMs(null)
    setWaitingSince(null)
    setOptInNeeded(false)
    setOptInSigned(false)
    setWatchingForFunding(false)
    setOptInConfirmed(false)
    signedOptInRef.current = null
    optInTxIdRef.current = null
    extraGasRef.current = null
    stablecoinFeeRef.current = null
    userHasSelectedChainRef.current = false
    setExtraGasAmount(null)
    setExtraGasAlgo(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const retry = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  const setSourceChain = useCallback(
    (symbol: string) => {
      userHasSelectedChainRef.current = true
      setSelectedSourceChainSymbol(symbol)
      // Auto-select first token of the new chain
      const chain = chains.find((c) => c.chainSymbol === symbol)
      if (chain && chain.tokens.length > 0) {
        setSelectedSourceTokenSymbol(chain.tokens[0].symbol)
      } else {
        setSelectedSourceTokenSymbol(null)
      }
      setReceivedAmount(null)
    },
    [chains],
  )

  const setSourceTokenBySymbol = useCallback((symbol: string) => {
    setSelectedSourceTokenSymbol(symbol)
    setReceivedAmount(null)
  }, [])

  const setDestinationTokenBySymbol = useCallback((symbol: string) => {
    setSelectedDestTokenSymbol(symbol)
    setReceivedAmount(null)
  }, [])

  // -- Opt-in helpers --

  async function checkAndPrepareOptIn(destSdkToken: TokenWithChainDetails): Promise<{ needed: boolean; canAfford: boolean }> {
    if (!algorandAddress || !algodClient) return { needed: false, canAfford: false }

    const info = await algodClient.accountInformation(algorandAddress).do()
    const assetId = Number(destSdkToken.tokenAddress)
    const isOptedIn = info.assets?.some((a: { assetId: number | bigint }) => Number(a.assetId) === assetId)

    if (isOptedIn) return { needed: false, canAfford: true }

    const available = Number(info.amount) - Number(info.minBalance)
    return { needed: true, canAfford: available >= OPT_IN_COST_MICRO }
  }

  async function buildAndSignOptIn(destSdkToken: TokenWithChainDetails): Promise<void> {
    if (!algorandAddress || !algodClient) throw new Error('Wallet not connected')

    const params = await algodClient.getTransactionParams().do()
    // Max validity window: 1000 rounds
    params.lastValid = params.firstValid + BigInt(1000)

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: algorandAddress,
      receiver: algorandAddress,
      amount: 0,
      assetIndex: Number(destSdkToken.tokenAddress),
      suggestedParams: params,
    })

    const signedTxns = await signTransactions([txn.toByte()])
    const signed = signedTxns[0]
    if (!signed) throw new Error('Opt-in transaction was not signed')

    signedOptInRef.current = signed
    optInTxIdRef.current = txn.txID()
    setOptInSigned(true)
  }

  async function submitOptIn(): Promise<void> {
    if (!algodClient || !signedOptInRef.current || !optInTxIdRef.current) {
      throw new Error('No signed opt-in transaction available')
    }

    await algodClient.sendRawTransaction(signedOptInRef.current).do()
    await algosdk.waitForConfirmation(algodClient, optInTxIdRef.current, 4)
    setOptInConfirmed(true)
    queryClient.invalidateQueries({ queryKey: ['account-info'] })
  }

  async function watchForFundingAndOptIn(): Promise<void> {
    if (!algorandAddress || !algodClient || !signedOptInRef.current || !optInTxIdRef.current) {
      throw new Error('Missing state for funding watch')
    }

    setWatchingForFunding(true)

    const nodeStatus = await algodClient.status().do()
    let currentRound = BigInt(nodeStatus.lastRound)

    // Watch for up to 1000 rounds (matching our tx validity window)
    const maxRounds = 1000
    for (let i = 0; i < maxRounds; i++) {
      // Wait for next block
      const blockStatus = await algodClient.statusAfterBlock(currentRound).do()
      currentRound = BigInt(blockStatus.lastRound)

      // Check balance
      const info = await algodClient.accountInformation(algorandAddress).do()
      const available = Number(info.amount) - Number(info.minBalance)

      if (available >= OPT_IN_COST_MICRO) {
        // Allbridge has funded the account — submit opt-in
        setWatchingForFunding(false)
        setStatus('opt-in-sent')
        await submitOptIn()
        return
      }
    }

    // If we exhausted the window, the pre-signed tx is expired
    setWatchingForFunding(false)
    throw new Error('Timed out waiting for account funding. Please try again.')
  }

  // -- Main bridge handler --

  const handleBridge = useCallback(async () => {
    const sdk = sdkRef.current
    const srcSdkToken = resolveSourceSdkToken()
    const dstSdkToken = resolveDestSdkToken()

    if (!sdk || !srcSdkToken || !dstSdkToken || !activeWallet || !algorandAddress || !evmAddress || !amount) {
      return
    }

    const getEvmProvider = (activeWallet as unknown as Record<string, unknown>).getEvmProvider as
      | (() => Promise<EIP1193Provider>)
      | undefined
    if (!getEvmProvider) {
      setError('Wallet does not support EVM provider access')
      setStatus('error')
      return
    }

    setStatus('signing')
    setError(null)
    setSourceTxId(null)
    setTransferStatus(null)
    setOptInNeeded(false)
    setOptInSigned(false)
    setOptInConfirmed(false)
    setWatchingForFunding(false)

    try {
      const { Messenger, FeePaymentMethod, AmountFormat } = await import('@allbridge/bridge-core-sdk')

      // 1. Check opt-in status on Algorand
      const optInCheck = await checkAndPrepareOptIn(dstSdkToken)
      setOptInNeeded(optInCheck.needed)

      // Use the pre-computed extra gas (stablecoin, converted to ALGO on destination).
      // Applied whenever the gas-fee effect determined the account has low balance.
      const extraGas = extraGasRef.current ?? undefined

      // 2. Get EVM provider and detect current chain
      const evmProvider = await getEvmProvider()
      const sourceChainData = allChains.find((c) => c.chainSymbol === srcSdkToken.chainSymbol)
      let onSourceEvmChain = false
      if (sourceChainData?.chainId) {
        try {
          const currentChainId = (await evmProvider.request({ method: 'eth_chainId' })) as string
          onSourceEvmChain = BigInt(currentChainId) === BigInt(sourceChainData.chainId)
        } catch {
          // Fall back to assuming we need to switch
        }
      }

      // 3. If opt-in needed and NOT already on source EVM chain, sign opt-in
      //    first while we're still on Algorand. If we ARE on the source chain,
      //    defer opt-in signing until after the bridge tx to save a chain switch.
      if (optInCheck.needed && !onSourceEvmChain) {
        setStatus('opting-in')
        await buildAndSignOptIn(dstSdkToken)
      }

      // 4. Switch to source EVM chain (skip if already there)
      setStatus('approving')
      if (sourceChainData?.chainId && !onSourceEvmChain) {
        await switchToEvmChain(evmProvider, sourceChainData.chainId)
      }

      // 5. Fees are inclusive: the user's input amount is the total they spend.
      //    In stablecoin mode the SDK deducts fee + extra gas from this amount.
      const stableFee = stablecoinFeeRef.current
      const useStablecoin = !!stableFee
      const bridgeAmount = amount

      // 6. Build and send approval transaction (EVM tokens need allowance)
      const hasAllowance = await sdk.bridge.checkAllowance({
        token: srcSdkToken,
        owner: evmAddress,
        amount: bridgeAmount,
      })

      if (!hasAllowance) {
        // rawTxBuilder.approve expects an integer amount (smallest token units).
        // Passing a float (e.g. "10.5") causes bn.js to throw "Invalid character".
        const approveAmountInt = floatToSmallestUnit(bridgeAmount, srcSdkToken.decimals)
        const approveTx = await sdk.bridge.rawTxBuilder.approve({
          token: srcSdkToken,
          owner: evmAddress,
          amount: approveAmountInt,
        })
        const approveHash = (await evmProvider.request({
          method: 'eth_sendTransaction',
          params: [approveTx],
        })) as string

        // Wait for approval tx to be mined before building the send tx
        let approveReceipt: unknown = null
        while (!approveReceipt) {
          approveReceipt = await evmProvider.request({
            method: 'eth_getTransactionReceipt',
            params: [approveHash],
          })
          if (!approveReceipt) {
            await new Promise((r) => setTimeout(r, 2000))
          }
        }
      }

      // 7. Build and send bridge transaction
      setStatus('signing')
      const sendParams = {
        amount: bridgeAmount,
        fromAccountAddress: evmAddress,
        toAccountAddress: algorandAddress,
        sourceToken: srcSdkToken,
        destinationToken: dstSdkToken,
        messenger: Messenger.ALLBRIDGE,
        ...(useStablecoin
          ? {
              gasFeePaymentMethod: FeePaymentMethod.WITH_STABLECOIN,
              fee: stableFee.int,
              ...(extraGas ? { extraGas, extraGasFormat: AmountFormat.FLOAT } : {}),
            }
          : {
              gasFeePaymentMethod: FeePaymentMethod.WITH_NATIVE_CURRENCY,
            }),
      }

      const rawTx = (await sdk.bridge.rawTxBuilder.send(sendParams)) as {
        from?: string
        to?: string
        value?: string
        data?: string
      }

      // The Allbridge SDK returns `value` as a decimal string (designed for web3.js),
      // but EIP-1193 `eth_sendTransaction` expects hex-encoded quantities.
      // Without conversion, MetaMask interprets the decimal string as hex, inflating the fee.
      const eip1193Tx = {
        ...rawTx,
        value: rawTx.value ? '0x' + BigInt(rawTx.value).toString(16) : undefined,
      }

      // Estimate gas per Allbridge EVM docs — wallets usually handle this,
      // but explicit estimation is more robust across wallet implementations.
      try {
        const gasEstimate = await evmProvider.request({
          method: 'eth_estimateGas',
          params: [eip1193Tx],
        })
        if (gasEstimate) {
          ;(eip1193Tx as Record<string, unknown>).gas = gasEstimate
        }
      } catch {
        // Fall back to wallet-estimated gas if estimation fails
      }

      setStatus('sending')
      const txHash = (await evmProvider.request({
        method: 'eth_sendTransaction',
        params: [eip1193Tx],
      })) as string

      setSourceTxId(txHash)

      // 8. Switch back to Algorand chain
      await switchBackToAlgorand(evmProvider)

      // 9. If opt-in needed and we were already on the source EVM chain,
      //    sign opt-in now that we've switched back to Algorand
      if (optInCheck.needed && onSourceEvmChain) {
        setStatus('opting-in')
        await buildAndSignOptIn(dstSdkToken)
      }

      // 10. Handle opt-in submission
      setStatus('waiting')
      setWaitingSince(Date.now())

      if (optInCheck.needed) {
        if (optInCheck.canAfford) {
          // Submit opt-in immediately
          setStatus('opt-in-sent')
          await submitOptIn()
          setStatus('waiting')
        } else {
          // Watch for Allbridge funding, then submit opt-in
          setStatus('watching-funding')
          await watchForFundingAndOptIn()
          setStatus('waiting')
        }
      }

      // 11. Transfer status polling takes over via the useEffect above
    } catch (err) {
      console.error('[useBridge] Bridge failed:', err)
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Bridge failed')

      // Try to switch back to Algorand chain on error
      try {
        const evmProvider = await getEvmProvider()
        await switchBackToAlgorand(evmProvider)
      } catch {
        // ignore
      }
    }
  }, [
    resolveSourceSdkToken,
    resolveDestSdkToken,
    activeWallet,
    algorandAddress,
    evmAddress,
    amount,
    allChains,
    algodClient,
    signTransactions,
    queryClient,
  ]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isAvailable: isLiquidEvm && sdkAvailable !== false,
    chains,
    chainsLoading,
    balancesLoading,
    sourceChain,
    setSourceChain,
    sourceToken,
    setSourceToken: setSourceTokenBySymbol,
    destinationToken,
    setDestinationToken: setDestinationTokenBySymbol,
    amount,
    setAmount,
    receivedAmount,
    quoteLoading,
    gasFee,
    gasFeeLoading,
    gasFeeUnit,
    extraGasAlgo,
    evmAddress,
    algorandAddress,
    estimatedTimeMs,
    waitingSince,
    transferStatus,
    optInNeeded,
    optInSigned,
    watchingForFunding,
    optInConfirmed,
    status,
    error,
    sourceTxId,
    handleBridge,
    reset,
    retry,
  }
}
