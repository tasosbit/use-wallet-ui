import { useWallet } from '@txnlab/use-wallet-react'
import { useQueryClient } from '@tanstack/react-query'
import algosdk from 'algosdk'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  getOrCreateSdk,
  fetchChainDetailsMap,
  getQuote,
  getGasFees,
  getEstimatedTime,
  getTransferStatus,
  type AllbridgeCoreSdk,
  type ChainDetailsWithTokens,
  type TokenWithChainDetails,
  type TransferStatusResponse,
  type NodeRpcUrls,
} from '../services/bridgeSdk'
import { createWeb3Adapter, type EIP1193Provider } from '../services/evmProviderAdapter'
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

  // Addresses
  evmAddress: string | null
  algorandAddress: string | null

  // Transfer tracking
  estimatedTimeMs: number | null
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

export function useBridge(options: UseBridgeOptions = {}): UseBridgeReturn {
  const { activeAddress, activeWallet, algodClient, signTransactions } = useWallet()
  const queryClient = useQueryClient()

  // SDK state
  const sdkRef = useRef<AllbridgeCoreSdk | null>(null)
  const [sdkAvailable, setSdkAvailable] = useState<boolean | null>(null)
  const [allChains, setAllChains] = useState<ChainDetailsWithTokens[]>([])
  const [chainsLoading, setChainsLoading] = useState(false)

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

  // Transfer state
  const [status, setStatus] = useState<BridgeStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sourceTxId, setSourceTxId] = useState<string | null>(null)
  const [estimatedTimeMs, setEstimatedTimeMs] = useState<number | null>(null)
  const [transferStatus, setTransferStatus] = useState<TransferStatusResponse | null>(null)

  // Opt-in state
  const [optInNeeded, setOptInNeeded] = useState(false)
  const [optInSigned, setOptInSigned] = useState(false)
  const [watchingForFunding, setWatchingForFunding] = useState(false)
  const [optInConfirmed, setOptInConfirmed] = useState(false)
  const signedOptInRef = useRef<Uint8Array | null>(null)
  const optInTxIdRef = useRef<string | null>(null)

  // Abort ref for cleanup
  const abortRef = useRef<AbortController | null>(null)

  // -- Derived values --

  // @ts-ignore - metadata exists on LiquidEvmBaseWallet accounts
  const evmAddress: string | null = (activeWallet?.activeAccount?.metadata?.evmAddress as string) ?? null
  const algorandAddress = activeAddress ?? null
  // @ts-ignore - isLiquid exists on Liquid wallet metadata
  const isLiquidEvm = !!activeWallet?.metadata?.isLiquid

  // Convert SDK chains to BridgeChain format (EVM chains only, exclude ALG)
  const chains: BridgeChain[] = allChains
    .filter((c) => c.chainType === 'EVM')
    .map((c) => ({
      chainSymbol: c.chainSymbol,
      chainName: c.name,
      chainId: c.chainId,
      tokens: c.tokens.map((t: TokenWithChainDetails) => ({
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        chainSymbol: c.chainSymbol,
        chainName: c.name,
      })),
    }))

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

  // -- Fetch gas fees when tokens change --

  useEffect(() => {
    const sdk = sdkRef.current
    const src = resolveSourceSdkToken()
    const dst = resolveDestSdkToken()
    if (!sdk || !src || !dst) {
      setGasFee(null)
      return
    }

    let cancelled = false
    setGasFeeLoading(true)

    ;(async () => {
      try {
        const { Messenger } = await import('@allbridge/bridge-core-sdk')
        const fees = await getGasFees(sdk, src, dst, Messenger.ALLBRIDGE)
        if (cancelled) return
        // Access native fee using the enum key
        const nativeFee = (fees as unknown as Record<string, { float?: string }>)['native']?.float ?? null
        setGasFee(nativeFee)
      } catch {
        if (!cancelled) setGasFee(null)
      } finally {
        if (!cancelled) setGasFeeLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [resolveSourceSdkToken, resolveDestSdkToken])

  // -- Debounced quote calculation --

  useEffect(() => {
    const sdk = sdkRef.current
    const src = resolveSourceSdkToken()
    const dst = resolveDestSdkToken()
    if (!sdk || !src || !dst || !amount || parseFloat(amount) <= 0) {
      setReceivedAmount(null)
      return
    }

    let cancelled = false
    setQuoteLoading(true)

    const timer = setTimeout(async () => {
      try {
        const { Messenger } = await import('@allbridge/bridge-core-sdk')
        const result = await getQuote(sdk, amount, src, dst, Messenger.ALLBRIDGE)
        if (!cancelled) setReceivedAmount(result)
      } catch {
        if (!cancelled) setReceivedAmount(null)
      } finally {
        if (!cancelled) setQuoteLoading(false)
      }
    }, 300)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [amount, resolveSourceSdkToken, resolveDestSdkToken])

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
          getProvider().then((p) => switchBackToAlgorand(p)).catch(() => {})
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
    setOptInNeeded(false)
    setOptInSigned(false)
    setWatchingForFunding(false)
    setOptInConfirmed(false)
    signedOptInRef.current = null
    optInTxIdRef.current = null
  }, [])

  const retry = useCallback(() => {
    setStatus('idle')
    setError(null)
  }, [])

  const setSourceChain = useCallback(
    (symbol: string) => {
      setSelectedSourceChainSymbol(symbol)
      // Auto-select first token of the new chain
      const chain = chains.find((c) => c.chainSymbol === symbol)
      if (chain && chain.tokens.length > 0) {
        setSelectedSourceTokenSymbol(chain.tokens[0].symbol)
      } else {
        setSelectedSourceTokenSymbol(null)
      }
      setAmount('')
      setReceivedAmount(null)
    },
    [chains],
  )

  const setSourceTokenBySymbol = useCallback((symbol: string) => {
    setSelectedSourceTokenSymbol(symbol)
    setAmount('')
    setReceivedAmount(null)
  }, [])

  const setDestinationTokenBySymbol = useCallback((symbol: string) => {
    setSelectedDestTokenSymbol(symbol)
    setReceivedAmount(null)
  }, [])

  // -- Opt-in helpers --

  async function checkAndPrepareOptIn(
    destSdkToken: TokenWithChainDetails,
  ): Promise<{ needed: boolean; canAfford: boolean }> {
    if (!algorandAddress || !algodClient) return { needed: false, canAfford: false }

    const info = await algodClient.accountInformation(algorandAddress).do()
    const assetId = Number(destSdkToken.tokenAddress)
    const isOptedIn = info.assets?.some(
      (a: { assetId: number | bigint }) => Number(a.assetId) === assetId,
    )

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
      const { Messenger, FeePaymentMethod } = await import('@allbridge/bridge-core-sdk')

      // 1. Check opt-in status on Algorand
      const optInCheck = await checkAndPrepareOptIn(dstSdkToken)
      setOptInNeeded(optInCheck.needed)

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

      // 5. Build and send approval transaction (EVM tokens need allowance)
      const web3 = createWeb3Adapter(evmProvider)
      const needsApproval = await sdk.bridge.checkAllowance({
        token: srcSdkToken,
        owner: evmAddress,
        amount,
      })

      if (!needsApproval) {
        const approveTx = await sdk.bridge.rawTxBuilder.approve({
          token: srcSdkToken,
          owner: evmAddress,
        })
        await evmProvider.request({
          method: 'eth_sendTransaction',
          params: [approveTx],
        })
      }

      // 6. Compute ETA
      const eta = getEstimatedTime(sdk, srcSdkToken, dstSdkToken, Messenger.ALLBRIDGE)
      setEstimatedTimeMs(eta)

      // 7. Build and send bridge transaction
      setStatus('signing')
      const sendParams = {
        amount,
        fromAccountAddress: evmAddress,
        toAccountAddress: algorandAddress,
        sourceToken: srcSdkToken,
        destinationToken: dstSdkToken,
        messenger: Messenger.ALLBRIDGE,
        gasFeePaymentMethod: FeePaymentMethod.WITH_NATIVE_CURRENCY,
      }

      const rawTx = await sdk.bridge.rawTxBuilder.send(sendParams, web3)

      setStatus('sending')
      const txHash = (await evmProvider.request({
        method: 'eth_sendTransaction',
        params: [rawTx],
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
    evmAddress,
    algorandAddress,
    estimatedTimeMs,
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
