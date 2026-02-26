import { useEffect, useState } from 'react'
import { Spinner } from './Spinner'

export interface BridgeChainDisplay {
  chainSymbol: string
  chainName: string
  tokens: BridgeTokenDisplay[]
}

export interface BridgeTokenDisplay {
  symbol: string
  name: string
  chainSymbol: string
  chainName: string
}

export type BridgeStatusValue =
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

export interface BridgePanelProps {
  // Chain/token selection
  chains: BridgeChainDisplay[]
  chainsLoading: boolean
  sourceChainSymbol: string | null
  onSourceChainChange: (symbol: string) => void
  sourceTokenSymbol: string | null
  onSourceTokenChange: (symbol: string) => void
  destinationTokenSymbol: string | null
  destinationTokens: BridgeTokenDisplay[]
  onDestinationTokenChange: (symbol: string) => void

  // Amount
  amount: string
  onAmountChange: (v: string) => void
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
  waitingSince: number | null
  transferStatus: BridgeTransferStatus | null

  // Opt-in tracking
  optInNeeded: boolean
  optInSigned: boolean
  watchingForFunding: boolean
  optInConfirmed: boolean

  // Status
  status: BridgeStatusValue
  error: string | null
  sourceTxId: string | null

  // Actions
  onBridge: () => void
  onReset: () => void
  onRetry: () => void
  onBack?: () => void

  /** Hide the built-in header (useful when the parent provides its own) */
  hideHeader?: boolean

  /** Auto-focus the source chain dropdown when mounted */
  autoFocusSourceChain?: boolean
}

export interface BridgeTransferStatus {
  sendConfirmations: number
  sendConfirmationsNeeded: number
  signaturesCount: number
  signaturesNeeded: number
  receiveConfirmations: number | null
  receiveConfirmationsNeeded: number | null
}

function formatShortAddr(addr: string): string {
  if (addr.length <= 14) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatTimeRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function BridgePanel({
  chains,
  chainsLoading,
  sourceChainSymbol,
  onSourceChainChange,
  sourceTokenSymbol,
  onSourceTokenChange,
  destinationTokenSymbol,
  destinationTokens,
  onDestinationTokenChange,
  amount,
  onAmountChange,
  receivedAmount,
  quoteLoading,
  gasFee,
  gasFeeLoading,
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
  onBridge,
  onReset,
  onRetry,
  onBack,
  hideHeader,
  autoFocusSourceChain,
}: BridgePanelProps) {
  const sourceChain = chains.find((c) => c.chainSymbol === sourceChainSymbol) ?? null
  const sourceTokens = sourceChain?.tokens ?? []

  const isProcessing =
    status === 'approving' ||
    status === 'signing' ||
    status === 'sending' ||
    status === 'opting-in' ||
    status === 'waiting' ||
    status === 'watching-funding' ||
    status === 'opt-in-sent'

  const canSubmit =
    status === 'idle' &&
    sourceChainSymbol &&
    sourceTokenSymbol &&
    destinationTokenSymbol &&
    amount &&
    parseFloat(amount) > 0 &&
    evmAddress &&
    algorandAddress

  return (
    <>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-2 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              disabled={isProcessing}
              className="-ml-1 p-1 rounded-lg hover:bg-[var(--wui-color-bg-secondary)] transition-colors text-[var(--wui-color-text-secondary)] flex items-center justify-center disabled:opacity-40"
              title="Back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h3 className="text-lg font-bold leading-none text-[var(--wui-color-text)] wallet-custom-font">Bridge</h3>
        </div>
      )}

      {/* Loading chains */}
      {chainsLoading && (
        <div className="flex items-center justify-center py-8 text-sm text-[var(--wui-color-text-secondary)]">
          <Spinner className="h-4 w-4 mr-2" />
          Loading bridge routes...
        </div>
      )}

      {/* No chains available */}
      {!chainsLoading && status === 'idle' && chains.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--wui-color-text-secondary)] mb-2">
            Bridge routes are currently unavailable.
          </p>
          <button
            onClick={onRetry}
            className="text-sm text-[var(--wui-color-primary)] hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Form (visible in idle state) */}
      {!chainsLoading && status === 'idle' && chains.length > 0 && (
        <>
          <p className="text-xs text-[var(--wui-color-text-tertiary)] mb-3">
            Bridge tokens from EVM chains to your Algorand account
          </p>

          {/* Source: Chain + Token selectors */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-[var(--wui-color-text-secondary)] mb-1">From</label>
            <div className="flex gap-2">
              <select
                autoFocus={autoFocusSourceChain}
                value={sourceChainSymbol ?? ''}
                onChange={(e) => onSourceChainChange(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-2 text-sm text-[var(--wui-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
              >
                {chains.map((c) => (
                  <option key={c.chainSymbol} value={c.chainSymbol}>
                    {c.chainName}
                  </option>
                ))}
              </select>
              <select
                value={sourceTokenSymbol ?? ''}
                onChange={(e) => onSourceTokenChange(e.target.value)}
                className="w-[100px] shrink-0 rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-2 text-sm text-[var(--wui-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
              >
                {sourceTokens.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-[var(--wui-color-text-secondary)] mb-1">Amount</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ''))}
              className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
            />
          </div>

          {/* Destination: Algorand + Token */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-[var(--wui-color-text-secondary)] mb-1">
              To (Algorand)
            </label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text-secondary)]">
                Algorand
              </div>
              <select
                value={destinationTokenSymbol ?? ''}
                onChange={(e) => onDestinationTokenChange(e.target.value)}
                className="w-[100px] shrink-0 rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-2 text-sm text-[var(--wui-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
              >
                {destinationTokens.map((t) => (
                  <option key={t.symbol} value={t.symbol}>
                    {t.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimated receive */}
          <div className="mb-3 rounded-lg bg-[var(--wui-color-bg-secondary)] p-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--wui-color-text-secondary)]">You receive</span>
              <span className="font-medium text-[var(--wui-color-text)]">
                {quoteLoading ? (
                  <Spinner className="h-3 w-3 inline" />
                ) : receivedAmount ? (
                  `${receivedAmount} ${destinationTokenSymbol ?? ''}`
                ) : (
                  '--'
                )}
              </span>
            </div>
            {gasFee && (
              <div className="flex justify-between items-center text-xs mt-1.5">
                <span className="text-[var(--wui-color-text-tertiary)]">Bridge fee</span>
                <span className="text-[var(--wui-color-text-tertiary)]">
                  {gasFeeLoading ? <Spinner className="h-2.5 w-2.5 inline" /> : gasFee}
                </span>
              </div>
            )}
            {estimatedTimeMs != null && estimatedTimeMs > 0 && (
              <div className="flex justify-between items-center text-sm mt-1.5">
                <span className="text-[var(--wui-color-text-secondary)]">Estimated time</span>
                <span className="font-medium text-[var(--wui-color-text)]">
                  ~{formatTimeRemaining(estimatedTimeMs)}
                </span>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="mb-4 text-xs text-[var(--wui-color-text-tertiary)] space-y-1">
            {evmAddress && (
              <div className="flex justify-between">
                <span>From</span>
                <span className="font-mono">{formatShortAddr(evmAddress)}</span>
              </div>
            )}
            {algorandAddress && (
              <div className="flex justify-between">
                <span>To</span>
                <span className="font-mono">{formatShortAddr(algorandAddress)}</span>
              </div>
            )}
          </div>

          {/* Bridge button */}
          <button
            onClick={onBridge}
            disabled={!canSubmit}
            className="w-full py-2.5 px-4 bg-[var(--wui-color-primary)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bridge
          </button>
        </>
      )}

      {/* Processing states */}
      {(status === 'approving' || status === 'signing') && (
        <div className="flex items-center justify-center py-6 text-sm text-[var(--wui-color-text-secondary)]">
          <Spinner className="h-4 w-4 mr-2" />
          {status === 'approving' ? 'Approving token...' : 'Confirm in wallet...'}
        </div>
      )}

      {status === 'opting-in' && (
        <div className="flex items-center justify-center py-6 text-sm text-[var(--wui-color-text-secondary)]">
          <Spinner className="h-4 w-4 mr-2" />
          Sign USDC opt-in for Algorand...
        </div>
      )}

      {status === 'sending' && (
        <div className="flex items-center justify-center py-6 text-sm text-[var(--wui-color-text-secondary)]">
          <Spinner className="h-4 w-4 mr-2" />
          Sending bridge transaction...
        </div>
      )}

      {/* Waiting / progress */}
      {(status === 'waiting' || status === 'watching-funding' || status === 'opt-in-sent') && (
        <BridgeProgress
          transferStatus={transferStatus}
          estimatedTimeMs={estimatedTimeMs}
          waitingSince={waitingSince}
          optInNeeded={optInNeeded}
          optInSigned={optInSigned}
          watchingForFunding={watchingForFunding}
          optInConfirmed={optInConfirmed}
          sourceTxId={sourceTxId}
        />
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="text-center py-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 mx-auto mb-2 text-green-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--wui-color-text)]">Bridge complete!</p>
          {receivedAmount && destinationTokenSymbol && (
            <p className="mt-1.5 text-sm text-[var(--wui-color-text-secondary)]">
              Received <span className="font-medium text-[var(--wui-color-text)]">{receivedAmount} {destinationTokenSymbol}</span>
            </p>
          )}
          {sourceTxId && (
            <p className="mt-1.5 text-xs text-[var(--wui-color-text-tertiary)]">
              TX: <span className="font-mono">{formatShortAddr(sourceTxId)}</span>
            </p>
          )}
          <button onClick={onReset} className="mt-3 text-sm text-[var(--wui-color-primary)] hover:underline">
            Bridge more
          </button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="text-center py-3">
          <p className="text-sm text-[var(--wui-color-danger-text)] mb-2">{error}</p>
          <button onClick={onRetry} className="text-sm text-[var(--wui-color-primary)] hover:underline">
            Try again
          </button>
        </div>
      )}
    </>
  )
}

// -- Bridge progress sub-component --

interface BridgeProgressProps {
  transferStatus: BridgeTransferStatus | null
  estimatedTimeMs: number | null
  waitingSince: number | null
  optInNeeded: boolean
  optInSigned: boolean
  watchingForFunding: boolean
  optInConfirmed: boolean
  sourceTxId: string | null
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-3.5 w-3.5 text-green-500 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Countdown({ estimatedTimeMs, waitingSince }: { estimatedTimeMs: number; waitingSince: number }) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const elapsed = now - waitingSince
  const remaining = Math.max(0, estimatedTimeMs - elapsed)

  return (
    <p className="text-center text-xs text-[var(--wui-color-text-tertiary)] mt-3">
      {remaining <= 0 ? 'Arriving about now' : `~${formatTimeRemaining(remaining)} remaining`}
    </p>
  )
}

function BridgeProgress({
  transferStatus,
  estimatedTimeMs,
  waitingSince,
  optInNeeded,
  optInSigned,
  watchingForFunding,
  optInConfirmed,
}: BridgeProgressProps) {
  const sendDone =
    transferStatus != null && transferStatus.sendConfirmations >= transferStatus.sendConfirmationsNeeded
  const sigsDone =
    transferStatus != null && transferStatus.signaturesCount >= transferStatus.signaturesNeeded
  const receiveDone =
    transferStatus?.receiveConfirmations != null &&
    transferStatus.receiveConfirmationsNeeded != null &&
    transferStatus.receiveConfirmations >= transferStatus.receiveConfirmationsNeeded

  return (
    <div className="py-4 flex flex-col items-center">
      <p className="text-sm font-medium text-[var(--wui-color-text)] text-center mb-3">Bridging USDC...</p>

      <div className="inline-flex flex-col gap-3">
        {/* Source confirmations */}
        <div className="flex items-center gap-2 text-xs">
          {sendDone ? <CheckIcon /> : <Spinner className="h-3.5 w-3.5 shrink-0" />}
          <span className="text-[var(--wui-color-text-secondary)]">
            Source confirmation
            {transferStatus && !sendDone && (
              <span className="ml-1 text-[var(--wui-color-text-tertiary)]">
                {transferStatus.sendConfirmations}/{transferStatus.sendConfirmationsNeeded}
              </span>
            )}
          </span>
        </div>

        {/* Validator signatures */}
        <div className="flex items-center gap-2 text-xs">
          {sigsDone ? (
            <CheckIcon />
          ) : sendDone ? (
            <Spinner className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--wui-color-border)]" />
          )}
          <span className="text-[var(--wui-color-text-secondary)]">
            Validator signatures
            {transferStatus && sendDone && !sigsDone && (
              <span className="ml-1 text-[var(--wui-color-text-tertiary)]">
                {transferStatus.signaturesCount}/{transferStatus.signaturesNeeded}
              </span>
            )}
          </span>
        </div>

        {/* Opt-in status (conditional) */}
        {optInNeeded && (
          <div className="flex items-center gap-2 text-xs">
            {optInConfirmed ? (
              <CheckIcon />
            ) : watchingForFunding ? (
              <Spinner className="h-3.5 w-3.5 shrink-0" />
            ) : optInSigned ? (
              <Spinner className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--wui-color-border)]" />
            )}
            <span className="text-[var(--wui-color-text-secondary)]">
              {optInConfirmed
                ? 'USDC opt-in confirmed'
                : watchingForFunding
                  ? 'Waiting for account funding...'
                  : optInSigned
                    ? 'Submitting opt-in...'
                    : 'USDC opt-in pending'}
            </span>
          </div>
        )}

        {/* Destination delivery */}
        <div className="flex items-center gap-2 text-xs">
          {receiveDone ? (
            <CheckIcon />
          ) : sendDone && sigsDone ? (
            <Spinner className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--wui-color-border)]" />
          )}
          <span className="text-[var(--wui-color-text-secondary)]">
            Destination delivery
            {transferStatus?.receiveConfirmations != null &&
              transferStatus.receiveConfirmationsNeeded != null &&
              !receiveDone && (
                <span className="ml-1 text-[var(--wui-color-text-tertiary)]">
                  {transferStatus.receiveConfirmations}/{transferStatus.receiveConfirmationsNeeded}
                </span>
              )}
          </span>
        </div>
      </div>

      {/* ETA countdown */}
      {estimatedTimeMs != null && waitingSince != null && !receiveDone && (
        <Countdown estimatedTimeMs={estimatedTimeMs} waitingSince={waitingSince} />
      )}
    </div>
  )
}
