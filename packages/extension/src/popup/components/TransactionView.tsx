// Duplicated rendering from use-wallet-ui BeforeSignDialog.tsx
// Adapted for extension popup (no @floating-ui, no useAssets hook)

import type { SerializableDecodedTransaction, TransactionDanger } from '../../types/messages'
import { TransactionFlow } from './TransactionFlow'

interface TransactionViewProps {
  transactions: SerializableDecodedTransaction[]
  message: string
  dangerous: TransactionDanger
  origin: string
  walletName?: string
  signing: boolean
  onApprove: () => void
  onReject: () => void
}

export function TransactionView({
  transactions,
  message,
  dangerous,
  origin,
  walletName,
  signing,
  onApprove,
  onReject,
}: TransactionViewProps) {
  // Build app escrow map from app call transactions
  const appEscrows: Record<string, string> = {}
  for (const txn of transactions) {
    if (txn.type === 'appl' && txn.appIndex) {
      // We can't derive application addresses without algosdk here,
      // so we skip escrow resolution in the extension popup.
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-1">
        <h2 className={`text-base font-bold ${dangerous ? 'text-[var(--wui-color-danger-text)]' : 'text-[var(--wui-color-text)]'}`}>
          {dangerous ? 'Review Dangerous ' : 'Review '}
          Transaction{transactions.length > 1 ? 's' : ''}
        </h2>
        <div className="text-xs text-[var(--wui-color-text-tertiary)] mt-0.5 truncate">
          {origin}
        </div>
      </div>

      {/* Danger description */}
      {dangerous ? (
        <div className="px-4 pb-2 text-sm font-bold text-[var(--wui-color-danger-text)]">
          {dangerous === 'rekey'
            ? 'This transaction will rekey your account, transferring signing authority to a different address.'
            : 'This transaction will close your account and transfer all remaining funds to another address.'}
        </div>
      ) : (
        <div className="px-4 pb-2 text-sm text-[var(--wui-color-text-secondary)]">
          {transactions.length === 1
            ? 'You are about to sign the following transaction:'
            : `You are about to sign ${transactions.length} transactions:`}
        </div>
      )}

      {/* Transaction list */}
      <div className="px-3 pb-3 max-h-60 overflow-y-auto">
        <div className="space-y-2">
          {transactions.map((txn) => (
            <div
              key={txn.index}
              className="rounded-sm border p-3 border-[var(--wui-color-primary)] bg-[var(--wui-color-bg-secondary)]"
            >
              <TransactionFlow txn={txn} appEscrows={appEscrows} />
            </div>
          ))}
        </div>
      </div>

      {/* Sign payload */}
      <div className="px-3 pb-3">
        <div className="text-sm flex flex-col gap-2 border border-[var(--wui-color-border)] rounded-xl p-3">
          <div>Transaction ID to sign:</div>
          <div className="font-mono break-all text-xs text-[var(--wui-color-danger-text)]">{message}</div>
          <div className="text-xs">Ensure the transaction ID is correct before approving.</div>
        </div>
      </div>

      {/* Footer */}
      {signing ? (
        <div className="px-4 py-3 border-t border-[var(--wui-color-border)] mt-auto">
          <div className="flex items-center gap-2 text-sm text-[var(--wui-color-text-secondary)]">
            <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing...
          </div>
        </div>
      ) : dangerous ? (
        <div className="px-4 py-3 border-t border-[var(--wui-color-border)] flex gap-3 mt-auto">
          <button
            onClick={onReject}
            className="flex-1 py-2 px-3 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] font-medium rounded-xl hover:brightness-90 transition-all text-sm"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-2 px-3 bg-[var(--wui-color-danger-text)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm"
          >
            Sign (Dangerous)
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-[var(--wui-color-border)] mt-auto">
          <div className="flex items-center gap-2 text-sm text-[var(--wui-color-text-secondary)]">
            <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Review in {walletName || 'wallet'}...
          </div>
        </div>
      )}
    </div>
  )
}
