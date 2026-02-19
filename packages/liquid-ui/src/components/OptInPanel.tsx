import { Spinner } from './Spinner'
import { TransactionStatus, type TransactionStatusValue } from './TransactionStatus'

export interface OptInPanelProps {
  assetIdInput: string
  setAssetIdInput: (v: string) => void
  assetInfo: { name: string; unitName: string; index: number } | null
  assetLookupLoading: boolean
  assetLookupError: string | null
  status: TransactionStatusValue
  error: string | null
  handleOptIn: () => void
  reset: () => void
  retry: () => void
  onBack: () => void
}

export function OptInPanel({
  assetIdInput,
  setAssetIdInput,
  assetInfo,
  assetLookupLoading,
  assetLookupError,
  status,
  error,
  handleOptIn,
  reset: _reset,
  retry,
  onBack,
}: OptInPanelProps) {
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
        <h3 className="text-lg font-bold leading-none text-[var(--wui-color-text)] wallet-custom-font">Opt In Asset</h3>
      </div>

      {/* Asset ID input */}
      <div className="mb-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Enter Asset ID"
          value={assetIdInput}
          onChange={(e) => setAssetIdInput(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-full rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2.5 px-3 text-sm text-[var(--wui-color-text)] placeholder:text-[var(--wui-color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent"
        />
      </div>

      {/* Loading */}
      {assetLookupLoading && (
        <div className="flex items-center justify-center py-4 text-sm text-[var(--wui-color-text-secondary)]">
          <Spinner className="h-4 w-4 mr-2" />
          Looking up asset...
        </div>
      )}

      {/* Lookup error */}
      {assetLookupError && (
        <div className="py-3 text-center text-sm text-[var(--wui-color-danger-text)]">{assetLookupError}</div>
      )}

      {/* Asset result */}
      {assetInfo && status === 'idle' && (
        <div className="bg-[var(--wui-color-bg-secondary)] rounded-lg p-3">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm font-medium text-[var(--wui-color-text)]">{assetInfo.name}</p>
              {assetInfo.unitName && (
                <p className="text-xs text-[var(--wui-color-text-secondary)]">{assetInfo.unitName}</p>
              )}
            </div>
            <span className="text-xs text-[var(--wui-color-text-tertiary)]">ID: {assetInfo.index}</span>
          </div>
          <button
            onClick={handleOptIn}
            className="w-full py-2 px-4 bg-[var(--wui-color-primary)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm"
          >
            Opt In
          </button>
        </div>
      )}

      <TransactionStatus
        status={status}
        error={error}
        successMessage="Opted in successfully!"
        onRetry={retry}
      />
    </>
  )
}
