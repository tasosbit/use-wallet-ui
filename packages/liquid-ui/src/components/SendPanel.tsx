import { useState } from 'react'
import type { AssetHoldingDisplay } from './ManagePanel'
import { Spinner } from './Spinner'
import { TransactionStatus, type TransactionStatusValue } from './TransactionStatus'

const FEE_RESERVE = 0.1

export interface SendPanelProps {
  sendType: 'algo' | 'asa'
  setSendType: (type: 'algo' | 'asa') => void
  receiver: string
  setReceiver: (v: string) => void
  amount: string
  setAmount: (v: string) => void
  assetIdInput: string
  setAssetIdInput: (v: string) => void
  assetInfo: { name: string; unitName: string; index: number } | null
  assetLookupLoading: boolean
  assetLookupError: string | null
  receiverOptInStatus?: 'idle' | 'checking' | 'opted-in' | 'not-opted-in'
  receiverAddressError?: string | null
  txId?: string | null
  explorerUrl?: string | null
  accountAssets?: AssetHoldingDisplay[]
  availableBalance?: number | null
  status: TransactionStatusValue
  error: string | null
  handleSend: () => void
  reset: () => void
  retry: () => void
  onBack: () => void
}

export function SendPanel({
  sendType,
  setSendType,
  receiver,
  setReceiver,
  amount,
  setAmount,
  assetIdInput,
  setAssetIdInput,
  assetInfo,
  assetLookupLoading,
  assetLookupError,
  receiverOptInStatus,
  receiverAddressError,
  txId,
  explorerUrl,
  accountAssets,
  availableBalance,
  status,
  error,
  handleSend,
  reset,
  retry,
  onBack,
}: SendPanelProps) {
  const handleAssetChange = (value: string) => {
    if (value === 'algo') {
      setSendType('algo')
      setAssetIdInput('')
    } else {
      setSendType('asa')
      setAssetIdInput(value)
      setShowReserveOption(false)
    }
    setAmount('')
  }

  const selectedValue = sendType === 'algo' ? 'algo' : assetIdInput

  const selectedAsset = accountAssets?.find((a) => String(a.assetId) === assetIdInput)

  const sendLabel = sendType === 'algo' ? 'ALGO' : assetInfo?.unitName || assetInfo?.name || 'Asset'

  // Available balance label
  const availableLabel =
    sendType === 'algo' && availableBalance != null
      ? `Available: ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ALGO`
      : sendType === 'asa' && selectedAsset
        ? `Available: ${selectedAsset.amount} ${selectedAsset.unitName || selectedAsset.name}`
        : null

  const [reserveFees, setReserveFees] = useState(true)
  const [showReserveOption, setShowReserveOption] = useState(false)

  const computeAlgoMax = (reserve: boolean) => {
    if (availableBalance == null) return '0'
    const max = Math.max(0, reserve ? availableBalance - FEE_RESERVE : availableBalance)
    return max.toFixed(6).replace(/\.?0+$/, '') || '0'
  }

  const handleMax = () => {
    if (sendType === 'algo' && availableBalance != null) {
      setShowReserveOption(true)
      setAmount(computeAlgoMax(reserveFees))
    } else if (sendType === 'asa' && selectedAsset) {
      setShowReserveOption(false)
      setAmount(selectedAsset.amount)
    }
  }

  const handleToggleReserve = () => {
    const next = !reserveFees
    setReserveFees(next)
    setAmount(computeAlgoMax(next))
  }

  // Overspend check
  const parsedAmount = amount !== '' ? parseFloat(amount) : NaN
  const isOverspend =
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    ((sendType === 'algo' && availableBalance != null && parsedAmount > availableBalance) ||
      (sendType === 'asa' && selectedAsset != null && parsedAmount > parseFloat(selectedAsset.amount)))

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onBack}
          className="-ml-1 p-1 rounded-lg hover:bg-[var(--wui-color-bg-secondary)] transition-colors text-[var(--wui-color-text-secondary)] flex items-center justify-center"
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
        <h3 className="text-lg font-bold leading-none text-[var(--wui-color-text)] wallet-custom-font">Send</h3>
      </div>

      {/* Send controls (hidden during/after transaction) */}
      {status === 'idle' && (
        <>
          {/* Label */}
          <p className="text-xs text-[var(--wui-color-text-tertiary)] mb-2">Send ALGO or assets to any Algorand address</p>

          {/* Available balance */}
          {availableLabel && <p className="self-end text-xs text-[var(--wui-color-text-secondary)] mb-1">{availableLabel}</p>}

          {/* Amount + asset selector */}
          <div className="mb-3 flex gap-2">
            <div className="flex-1 min-w-0 relative">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 pr-12 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleMax}
                className="absolute right-2 inset-y-0 my-auto h-fit text-[10px] font-medium text-[var(--wui-color-primary)] bg-[var(--wui-color-bg-tertiary)] rounded px-1.5 py-0.5 hover:brightness-90 transition-all"
              >
                max
              </button>
            </div>
            <select
              value={selectedValue}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="w-[120px] shrink-0 rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-2 text-sm text-[var(--wui-color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
            >
              <option value="algo">ALGO</option>
              {accountAssets?.map((asset) => (
                <option key={asset.assetId} value={String(asset.assetId)}>
                  {asset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reserve fees checkbox (shown after clicking MAX on ALGO) */}
          {sendType === 'algo' && showReserveOption && (
            <label className="flex items-center gap-1.5 mb-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={reserveFees}
                onChange={handleToggleReserve}
                className="accent-[var(--wui-color-primary)] h-3.5 w-3.5"
              />
              <span className="text-xs text-[var(--wui-color-text-secondary)]">Save some for transaction costs</span>
            </label>
          )}

          {/* Overspend warning */}
          {isOverspend && <p className="mb-3 text-xs text-[var(--wui-color-danger-text)]">Amount exceeds available balance</p>}

          {/* Asset lookup feedback */}
          {sendType === 'asa' && (
            <>
              {assetLookupLoading && (
                <div className="flex items-center mb-3 text-xs text-[var(--wui-color-text-secondary)]">
                  <Spinner className="h-3 w-3 mr-1.5" />
                  Looking up asset...
                </div>
              )}
              {assetLookupError && <p className="mb-3 text-xs text-[var(--wui-color-danger-text)]">{assetLookupError}</p>}
            </>
          )}

          {/* Receiver address */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Receiver ALGO address"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
            />
          </div>

          {/* Invalid receiver address */}
          {receiverAddressError && <p className="mb-3 text-xs text-[var(--wui-color-danger-text)]">{receiverAddressError}</p>}

          {/* Receiver opt-in check feedback */}
          {sendType === 'asa' && receiverOptInStatus === 'not-opted-in' && (
            <p className="mb-3 text-xs text-[var(--wui-color-danger-text)]">Receiver has not opted into this asset</p>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={
              !receiver ||
              !amount ||
              !!receiverAddressError ||
              isOverspend ||
              (sendType === 'asa' && !assetInfo) ||
              (sendType === 'asa' && receiverOptInStatus !== 'opted-in' && receiverOptInStatus !== 'idle')
            }
            className="w-full py-2.5 px-4 bg-[var(--wui-color-primary)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendType === 'asa' && receiverOptInStatus === 'checking' ? 'Verifying...' : `Send ${sendLabel}`}
          </button>
        </>
      )}

      <TransactionStatus
        status={status}
        error={error}
        successMessage="Sent successfully!"
        onRetry={retry}
        txId={txId}
        explorerUrl={explorerUrl}
      />

      {status === 'success' && (
        <button onClick={reset} className="mt-1 w-full text-sm text-[var(--wui-color-primary)] hover:underline">
          Send more
        </button>
      )}
    </>
  )
}
