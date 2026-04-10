import { useMemo } from 'react'
import { AlgoSymbol } from './AlgoSymbol'
import { AssetSelect } from './AssetSelect'
import { BackButton } from './BackButton'
import { SecondaryButton } from './SecondaryButton'
import type { AssetHoldingDisplay } from './ManagePanel'
import { Spinner } from './Spinner'
import { TransactionStatus } from './TransactionStatus'
import type { SwapStatusValue } from '../hooks/useSwapPanel'
import { ArrowsUpDown } from './icons'
import type { SwapQuoteDisplay } from '../hooks/useSwapPanel'

export interface SwapPanelProps {
  activeAddress?: string | null
  fromAssetId: string
  setFromAssetId: (id: string) => void
  toAssetId: string
  setToAssetId: (id: string) => void
  amount: string
  setAmount: (v: string) => void
  slippage: string
  setSlippage: (v: string) => void
  quote: SwapQuoteDisplay | null
  quoteLoading: boolean
  quoteError: string | null
  accountAssets?: AssetHoldingDisplay[]
  totalBalance?: number | null
  availableBalance?: number | null
  status: SwapStatusValue
  error: string | null
  txId?: string | null
  explorerUrl?: string | null
  swapDirection: () => void
  handleSwap: () => void
  reset: () => void
  retry: () => void
  onBack: () => void
}

function formatOutputAmount(quote: SwapQuoteDisplay, decimals: number): string {
  const amount = Number(quote.quote) / 10 ** decimals
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.min(decimals, 6),
  })
}

export function SwapPanel({
  fromAssetId,
  setFromAssetId,
  toAssetId,
  setToAssetId,
  amount,
  setAmount,
  slippage,
  setSlippage,
  quote,
  quoteLoading,
  quoteError,
  accountAssets,
  availableBalance,
  status,
  error,
  txId,
  explorerUrl,
  swapDirection,
  handleSwap,
  reset: _reset,
  retry,
  onBack,
}: SwapPanelProps) {
  const algoIcon = <AlgoSymbol scale={1} />

  const assetOptions = useMemo(() => {
    const opts: { value: string; label: string; logo?: string | null; icon?: React.ReactNode; verificationTier?: AssetHoldingDisplay['verificationTier'] }[] = [
      { value: '0', label: 'ALGO', icon: algoIcon },
    ]
    if (accountAssets) {
      for (const a of accountAssets) {
        opts.push({
          value: String(a.assetId),
          label: a.unitName || a.name,
          logo: a.logo,
          verificationTier: a.verificationTier,
        })
      }
    }
    return opts
  }, [accountAssets])

  const fromAsset = fromAssetId === '0'
    ? { unitName: 'ALGO', decimals: 6 }
    : accountAssets?.find((a) => String(a.assetId) === fromAssetId)

  const toAsset = toAssetId === '0'
    ? { unitName: 'ALGO', decimals: 6 }
    : accountAssets?.find((a) => String(a.assetId) === toAssetId)

  const fromLabel = fromAsset && 'unitName' in fromAsset ? fromAsset.unitName : 'Asset'
  const toLabel = toAsset && 'unitName' in toAsset ? toAsset.unitName : 'Asset'
  const toDecimals = toAsset && 'decimals' in toAsset ? toAsset.decimals : 6

  // Available balance for selected "from" asset
  const fromAvailable = fromAssetId === '0'
    ? (availableBalance != null ? `${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ALGO` : null)
    : (() => {
      const asset = accountAssets?.find((a) => String(a.assetId) === fromAssetId)
      return asset ? `${asset.amount} ${asset.unitName || asset.name}` : null
    })()

  const handleFromChange = (value: string) => {
    if (value === toAssetId) {
      swapDirection()
    } else {
      setFromAssetId(value)
      setAmount('')
    }
  }

  const handleToChange = (value: string) => {
    if (value === fromAssetId) {
      swapDirection()
    } else {
      setToAssetId(value)
    }
  }

  const handleMax = () => {
    if (fromAssetId === '0' && availableBalance != null) {
      const max = Math.max(0, availableBalance - 0.1) // Reserve for fees
      setAmount(max.toFixed(6).replace(/\.?0+$/, '') || '0')
    } else {
      const asset = accountAssets?.find((a) => String(a.assetId) === fromAssetId)
      if (asset) setAmount(asset.amount)
    }
  }

  const parsedAmount = amount !== '' ? parseFloat(amount) : NaN
  const isOverspend = !isNaN(parsedAmount) && parsedAmount > 0 && fromAssetId === '0'
    ? (availableBalance != null && parsedAmount > availableBalance)
    : (() => {
      const asset = accountAssets?.find((a) => String(a.assetId) === fromAssetId)
      return asset ? parsedAmount > parseFloat(asset.amount) : false
    })()

  const canSwap =
    status === 'idle' &&
    fromAssetId &&
    toAssetId &&
    fromAssetId !== toAssetId &&
    amount &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    !isOverspend &&
    quote &&
    !quoteLoading

  // Compute exchange rate from quote
  const rateDisplay = quote && fromAsset && toAsset
    ? (() => {
      const fromDecimals = 'decimals' in fromAsset ? fromAsset.decimals : 6
      const inputHuman = Number(quote.amount) / 10 ** fromDecimals
      const outputHuman = Number(quote.quote) / 10 ** toDecimals
      if (inputHuman === 0) return null
      const rate = outputHuman / inputHuman
      return `1 ${fromLabel} = ${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${toLabel}`
    })()
    : null

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BackButton onClick={onBack} />
        <h3 className="text-lg font-bold leading-none text-[var(--wui-color-text)] wallet-custom-font">Swap</h3>
      </div>

      {/* Swap form (hidden during/after transaction) */}
      {status === 'idle' && (
        <>
          <p className="text-xs text-[var(--wui-color-text-secondary)] mb-2">
            Swap tokens at the best rate across Algorand DEXes
          </p>

          {/* You pay */}
          <div className="mb-1">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[var(--wui-color-text-secondary)]">You pay</label>
              {fromAvailable && (
                <span className="text-xs text-[var(--wui-color-text-secondary)]">Available: {fromAvailable}</span>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 relative">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  autoFocus={true}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 pr-12 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleMax}
                  className="absolute right-2 inset-y-0 my-auto h-fit text-[10px] font-medium text-[var(--wui-color-primary)] bg-[var(--wui-color-bg-tertiary)] rounded px-1.5 py-0.5 hover:brightness-90 transition-all"
                >
                  max
                </button>
              </div>
              <AssetSelect
                value={fromAssetId}
                onChange={handleFromChange}
                className="w-[140px] shrink-0"
                options={assetOptions}
              />
            </div>
          </div>

          {/* Overspend warning */}
          {isOverspend && <p className="mb-1 text-xs text-[var(--wui-color-danger-text)]">Amount exceeds available balance</p>}

          {/* Swap direction toggle */}
          <div className="flex justify-center mt-3 mb-1">
            <button
              type="button"
              onClick={swapDirection}
              className="p-1.5 rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] hover:bg-[var(--wui-color-bg-tertiary)] transition-colors text-[var(--wui-color-text-secondary)]"
              title="Swap direction"
            >
              <ArrowsUpDown size={16} />
            </button>
          </div>

          {/* You receive */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-[var(--wui-color-text-secondary)] mb-1">You receive</label>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <div className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text)] min-h-[40px] flex items-center">
                  {quoteLoading ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : quote ? (
                    <span className="tabular-nums">{formatOutputAmount(quote, toDecimals)}</span>
                  ) : (
                    <span className="text-[var(--wui-color-text-secondary)]">--</span>
                  )}
                </div>
              </div>
              <AssetSelect
                value={toAssetId}
                onChange={handleToChange}
                className="w-[140px] shrink-0"
                options={assetOptions}
              />
            </div>
          </div>

          {/* Quote error */}
          {quoteError && <p className="mb-3 text-xs text-[var(--wui-color-danger-text)] break-words">{quoteError}</p>}

          {/* Quote details */}
          {quote && (
            <div className="mb-3 rounded-lg bg-[var(--wui-color-bg-secondary)] p-3 space-y-1.5">
              {rateDisplay && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--wui-color-text-secondary)]">Rate</span>
                  <span className="text-[var(--wui-color-text-secondary)]">{rateDisplay}</span>
                </div>
              )}
              {quote.userPriceImpact !== undefined && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--wui-color-text-secondary)]">Price impact</span>
                  <span className={
                    quote.userPriceImpact > 5 ? 'text-[var(--wui-color-danger-text)] font-medium'
                    : quote.userPriceImpact > 3 ? 'text-orange-500'
                    : quote.userPriceImpact > 1 ? 'text-yellow-500'
                    : 'text-green-500'
                  }>
                    {quote.userPriceImpact.toFixed(2)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--wui-color-text-secondary)]">Route</span>
                <span className="text-[var(--wui-color-text-secondary)]">
                  {Object.entries(quote.flattenedRoute)
                    .map(([protocol, pct]) => `${protocol}: ${pct}%`)
                    .join(', ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--wui-color-text-secondary)]">Slippage</span>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value.replace(/[^0-9.]/g, ''))}
                    className="w-10 text-right rounded border border-[var(--wui-color-border)] bg-[var(--wui-color-bg)] px-1 py-0.5 text-xs text-[var(--wui-color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--wui-color-primary)]"
                  />
                  <span className="text-[var(--wui-color-text-secondary)]">%</span>
                </div>
              </div>
              {quote.usdIn > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--wui-color-text-secondary)]">USD value</span>
                  <span className="text-[var(--wui-color-text-secondary)]">
                    ${quote.usdIn.toFixed(2)} → ${quote.usdOut.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Swap button */}
          <button
            onClick={handleSwap}
            disabled={!canSwap}
            className="w-full py-2.5 px-4 bg-[var(--wui-color-primary)] text-[var(--wui-color-primary-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {quoteLoading ? 'Getting quote...' : `Swap ${fromLabel} for ${toLabel}`}
          </button>
        </>
      )}

      <TransactionStatus
        status={status === 'quoting' ? 'idle' : status}
        error={error}
        successMessage="Swap completed!"
        onRetry={retry}
        txId={txId}
        explorerUrl={explorerUrl}
      />

      {status === 'success' && (
        <SecondaryButton onClick={onBack} className="mt-3">Back</SecondaryButton>
      )}
    </>
  )
}
