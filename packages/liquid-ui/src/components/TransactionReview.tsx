import type { ReactNode } from 'react'
import { TransactionFlow } from './TransactionFlow'
import { useTransactionData } from '../hooks/useTransactionData'
import type { TransactionData, TransactionDanger, AssetLookupClient } from '../types'

export interface TransactionReviewProps {
  transactions: TransactionData[]
  message: string
  dangerous: TransactionDanger
  algodClient?: AssetLookupClient
  getApplicationAddress?: (appId: number) => { toString(): string }
  onApprove: () => void
  onReject: () => void
  signing?: boolean
  walletName?: string
  origin?: string
  headerAction?: ReactNode
  payloadVerified?: boolean | null
}

export function TransactionReview({
  transactions,
  message,
  dangerous,
  algodClient,
  getApplicationAddress,
  onApprove,
  onReject,
  signing,
  walletName,
  origin,
  headerAction,
  payloadVerified,
}: TransactionReviewProps) {
  const { loading, assets, appEscrows } = useTransactionData(transactions, {
    algodClient,
    getApplicationAddress,
  })

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1">
        <h2 className={`text-lg font-bold ${dangerous ? 'text-[var(--wui-color-danger-text)]' : 'text-[var(--wui-color-text)]'}`}>
          {dangerous ? 'Review Dangerous ' : 'Review '}
          Transaction{transactions.length > 1 ? 's' : ''}
        </h2>
        {headerAction}
      </div>

      {/* Origin (extension shows request origin) */}
      {origin && (
        <div className="px-6 text-xs text-[var(--wui-color-text-tertiary)] truncate">
          {origin}
        </div>
      )}

      {/* Danger description */}
      {dangerous ? (
        <div className="px-6 pb-3 text-sm font-bold text-[var(--wui-color-danger-text)]">
          {dangerous === 'rekey'
            ? 'This transaction will rekey your account, transferring signing authority to a different address. You will no longer be able to sign transactions with your current key.'
            : 'This transaction will close your account and transfer all remaining funds to another address. This action is irreversible.'}
        </div>
      ) : (
        <div className="px-6 pb-3 text-sm text-[var(--wui-color-text-secondary)]">
          {transactions.length === 1
            ? 'You are about to sign the following transaction:'
            : `You are about to sign ${transactions.length} transactions:`}
        </div>
      )}

      {/* Transaction list */}
      <div className="px-4 pb-4 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-[var(--wui-color-text-secondary)]">
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading asset info...
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((txn) => (
              <div
                key={txn.index}
                className="rounded-sm border p-3 border-[var(--wui-color-primary)] bg-[var(--wui-color-bg-secondary)]"
              >
                <TransactionFlow txn={txn} assetInfo={txn.assetIndex ? assets[txn.assetIndex.toString()] : undefined} appEscrows={appEscrows} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payload verification warning */}
      {payloadVerified === false && (
        <div className="px-4 pb-4">
          <div className="text-sm font-bold text-[var(--wui-color-danger-text)] border border-[var(--wui-color-danger-text)] rounded-xl p-3 bg-[var(--wui-color-danger-bg)]">
            Payload verification failed. The provided payload was invalid and has been recalculated from the raw transactions.
          </div>
        </div>
      )}

      {/* Sign payload */}
      <div className="px-4 pb-4">
        <div className="text-sm flex flex-col gap-2 border border-[var(--wui-color-border)] rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span>Transaction ID to sign:</span>
            {payloadVerified === true && (
              <span className="text-xs text-green-600 font-medium">Verified</span>
            )}
          </div>
          <div className="font-mono break-all text-[var(--wui-color-danger-text)]">{message}</div>
          <div>Ensure the transaction ID is correct before approving.</div>
        </div>
      </div>

      {/* Footer */}
      {signing ? (
        <div className="px-6 py-4 border-t border-[var(--wui-color-border)]">
          <div className="flex items-center gap-2 text-sm text-[var(--wui-color-text-secondary)]">
            <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing...
          </div>
        </div>
      ) : dangerous ? (
        <div className="px-6 py-4 border-t border-[var(--wui-color-border)] flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] font-medium rounded-xl hover:brightness-90 transition-all text-sm"
          >
            Reject
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-2.5 px-4 bg-[var(--wui-color-danger-text)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm"
          >
            Sign (Dangerous)
          </button>
        </div>
      ) : (
        <div className="px-6 py-4 border-t border-[var(--wui-color-border)]">
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
