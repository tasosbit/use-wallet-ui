import { Spinner } from './Spinner'
import { TransactionStatus, type TransactionStatusValue } from './TransactionStatus'

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
  status,
  error,
  handleSend,
  reset: _reset,
  retry,
  onBack,
}: SendPanelProps) {
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

      {/* ALGO / Asset toggle */}
      <div className="flex mb-4 bg-[var(--wui-color-bg-secondary)] rounded-lg p-1">
        <button
          onClick={() => setSendType('algo')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
            sendType === 'algo'
              ? 'bg-[var(--wui-color-bg)] text-[var(--wui-color-text)] shadow-sm'
              : 'text-[var(--wui-color-text-secondary)] hover:text-[var(--wui-color-text)]'
          }`}
        >
          ALGO
        </button>
        <button
          onClick={() => setSendType('asa')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
            sendType === 'asa'
              ? 'bg-[var(--wui-color-bg)] text-[var(--wui-color-text)] shadow-sm'
              : 'text-[var(--wui-color-text-secondary)] hover:text-[var(--wui-color-text)]'
          }`}
        >
          Asset
        </button>
      </div>

      {/* Asset ID input (ASA mode only) */}
      {sendType === 'asa' && (
        <div className="mb-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Asset ID"
            value={assetIdInput}
            onChange={(e) => setAssetIdInput(e.target.value.replace(/[^0-9]/g, ''))}
            className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
          />
          {assetLookupLoading && (
            <div className="flex items-center mt-2 text-xs text-[var(--wui-color-text-secondary)]">
              <Spinner className="h-3 w-3 mr-1.5" />
              Looking up asset...
            </div>
          )}
          {assetLookupError && (
            <p className="mt-2 text-xs text-[var(--wui-color-danger-text)]">{assetLookupError}</p>
          )}
          {assetInfo && (
            <div className="mt-2 flex items-center justify-between text-xs text-[var(--wui-color-text-secondary)] bg-[var(--wui-color-bg-secondary)] rounded-md px-2 py-1.5">
              <span className="font-medium text-[var(--wui-color-text)]">{assetInfo.name}</span>
              {assetInfo.unitName && <span>{assetInfo.unitName}</span>}
            </div>
          )}
        </div>
      )}

      {/* Receiver address */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Receiver address"
          value={receiver}
          onChange={(e) => setReceiver(e.target.value)}
          className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
        />
      </div>

      {/* Amount */}
      <div className="mb-4">
        <input
          type="text"
          inputMode="decimal"
          placeholder={
            sendType === 'algo'
              ? 'Amount (ALGO)'
              : assetInfo
                ? `Amount (${assetInfo.unitName || assetInfo.name})`
                : 'Amount'
          }
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
          className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
        />
      </div>

      {/* Send button */}
      {status === 'idle' && (
        <button
          onClick={handleSend}
          disabled={!receiver || !amount || (sendType === 'asa' && !assetInfo)}
          className="w-full py-2.5 px-4 bg-[var(--wui-color-primary)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send {sendType === 'algo' ? 'ALGO' : assetInfo?.unitName || 'Asset'}
        </button>
      )}

      <TransactionStatus
        status={status}
        error={error}
        successMessage="Sent successfully!"
        onRetry={retry}
      />
    </>
  )
}
