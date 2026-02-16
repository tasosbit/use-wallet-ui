import {
  useFloating,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useId,
} from '@floating-ui/react'
import { useState } from 'react'

import type { DecodedTransaction, TransactionDanger } from '../utils/decodeTransactions'
import { useWalletUI } from '../providers/WalletUIProvider'

interface BeforeSignDialogProps {
  transactions: DecodedTransaction[]
  message: string
  onApprove: () => void
  onReject: () => void
  dangerous: TransactionDanger
}

export function BeforeSignDialog({ transactions, message, dangerous, onApprove, onReject }: BeforeSignDialogProps) {
  const { theme } = useWalletUI()
  const [animationState, setAnimationState] = useState<'starting' | 'entered' | 'exiting' | null>('starting')

  const dataTheme = theme === 'system' ? undefined : theme

  const { refs, context } = useFloating({
    open: true,
    onOpenChange: (open) => {
      console.log('open changed:', open) // why not firing
      if (!open) {
        setAnimationState('exiting')
        if (dangerous) {
          setTimeout(() => onReject(), 150)
        }
      }
    },
  })

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' })
  const role = useRole(context, { role: 'alertdialog' })
  const { getFloatingProps } = useInteractions([dismiss, role])

  const labelId = useId()
  const descriptionId = useId()

  // Trigger enter animation
  if (animationState === 'starting') {
    requestAnimationFrame(() => setAnimationState('entered'))
  }

  return (
    <FloatingPortal id="wallet-sign-dialog-portal">
      <div data-wallet-theme data-wallet-ui data-theme={dataTheme}>
        <FloatingOverlay
          className="grid place-items-center px-4 z-[100] transition-opacity duration-150 ease-in-out bg-[var(--wui-color-overlay)] data-[state=starting]:opacity-0 data-[state=exiting]:opacity-0 data-[state=entered]:opacity-100"
          data-state={animationState}
          lockScroll
        >
          <FloatingFocusManager context={context} modal={true}>
            <div
              ref={refs.setFloating}
              {...getFloatingProps({
                'aria-labelledby': labelId,
                'aria-describedby': descriptionId,
              })}
              role="alertdialog"
              data-state={animationState}
              className="w-full max-w-md rounded-3xl bg-[var(--wui-color-bg)] shadow-xl transform transition-all duration-150 ease-in-out data-[state=starting]:opacity-0 data-[state=starting]:scale-90 data-[state=exiting]:opacity-0 data-[state=exiting]:scale-90 data-[state=entered]:opacity-100 data-[state=entered]:scale-100"
              style={{ marginTop: '-0.5rem' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-1">
                <h2 id={labelId} className="text-lg font-bold text-[var(--wui-color-text)] wallet-custom-font">
                  Review Transaction{transactions.length > 1 ? 's' : ''}
                </h2>
                <button
                  onClick={() => {
                    setAnimationState('exiting')
                    setTimeout(() => {
                      dangerous ? onReject() : onApprove()
                    }, 150)
                  }}
                  className="w-8 h-8 flex-none flex items-center justify-center rounded-full bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] hover:brightness-90 transition-all"
                  aria-label="Close dialog"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Description */}
              {dangerous ? (
                <div id={descriptionId} className="px-6 pb-3 text-sm font-bold text-[var(--wui-color-danger-text)]">
                  {dangerous === 'rekey'
                    ? 'This transaction will rekey your account, transferring signing authority to a different address. You will no longer be able to sign transactions with your current key.'
                    : 'This transaction will close your account and transfer all remaining funds to another address. This action is irreversible.'}
                </div>
              ) : (
                <div id={descriptionId} className="px-6 pb-3 text-sm text-[var(--wui-color-text-secondary)]">
                  {transactions.length === 1
                    ? 'You are about to sign the following transaction:'
                    : `You are about to sign ${transactions.length} transaction${transactions.length > 1 ? 's' : ''}:`}
                </div>
              )}
              {/* Transaction list */}
              <div className="px-4 pb-4 max-h-80 overflow-y-auto">
                <div className="space-y-2">
                  {transactions.map((txn) => (
                    <div
                      key={txn.index}
                      className={`rounded-xl border p-3 ${'border-[var(--wui-color-primary)] bg-[var(--wui-color-bg-secondary)]'}`}
                    >
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[var(--wui-color-text-tertiary)]">From</span>
                          <span className="text-[var(--wui-color-text-secondary)] font-mono">{txn.senderShort}</span>
                        </div>

                        {txn.receiver && (
                          <div className="flex justify-between">
                            <span className="text-[var(--wui-color-text-tertiary)]">To</span>
                            <span className="text-[var(--wui-color-text-secondary)] font-mono">{txn.receiverShort}</span>
                          </div>
                        )}

                        {txn.amount && (
                          <div className="flex justify-between">
                            <span className="text-[var(--wui-color-text-tertiary)]">Amount</span>
                            <span className="text-[var(--wui-color-text)] font-medium">{txn.amount}</span>
                          </div>
                        )}

                        {txn.assetIndex !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-[var(--wui-color-text-tertiary)]">Asset ID</span>
                            <span className="text-[var(--wui-color-text-secondary)]">{txn.assetIndex}</span>
                          </div>
                        )}

                        {txn.appIndex !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-[var(--wui-color-text-tertiary)]">App ID</span>
                            <span className="text-[var(--wui-color-text-secondary)]">{txn.appIndex}</span>
                          </div>
                        )}

                        {txn.rekeyTo && (
                          <div className="flex justify-between">
                            <span className="font-bold text-[var(--wui-color-danger-text)]">Rekey To</span>
                            <span className="font-mono font-bold text-[var(--wui-color-danger-text)]">{txn.rekeyToShort}</span>
                          </div>
                        )}

                        {txn.closeRemainderTo && (
                          <div className="flex justify-between">
                            <span className="font-bold text-[var(--wui-color-danger-text)]">Close To</span>
                            <span className="font-mono font-bold text-[var(--wui-color-danger-text)]">{txn.closeRemainderToShort}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 pb-4">
                <div className="text-sm flex flex-col gap-2 border border-[var(--wui-color-danger-text)] text-[var(--wui-color-danger-text)] rounded-xl p-3">
                  <div>Message to sign:</div>
                  <div className="font-mono break-all">{message}</div>
                  <div className="mt-2">Ensure the message is correct before approving.</div>
                </div>
              </div>

              {/* Action buttons */}

              {dangerous ? (
                <div className="px-6 py-4 border-t border-[var(--wui-color-border)] flex gap-3">
                  <button
                    onClick={() => {
                      setAnimationState('exiting')
                      setTimeout(() => onReject(), 150)
                    }}
                    className="flex-1 py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] font-medium rounded-xl hover:brightness-90 transition-all text-sm"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setAnimationState('exiting')
                      setTimeout(() => onApprove(), 150)
                    }}
                    className="flex-1 py-2.5 px-4 bg-[var(--wui-color-primary)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm"
                  >
                    Approve
                  </button>
                </div>
              ) : null}
              <div className="px-6 py-4 text-xs underline border-t border-[var(--wui-color-border)] text-[var(--wui-color-text-secondary)] flex gap-3">
                How does this work?
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      </div>
    </FloatingPortal>
  )
}
