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
import { useMemo, useState } from 'react'

import type { DecodedTransaction, TransactionDanger } from '../utils/decodeTransactions'
import { useWalletUI } from '../providers/WalletUIProvider'
import { useAssets, type AssetInfo } from '../hooks/useAssets'
import { getApplicationAddress } from 'algosdk'

interface BeforeSignDialogProps {
  transactions: DecodedTransaction[]
  message: string
  onApprove: () => void
  onReject: () => void
  onClose: () => void
  dangerous: TransactionDanger
}

interface TransactionFlowProps {
  txn: DecodedTransaction
  assetInfo?: AssetInfo
  appEscrows?: Record<string, string>
}

function formatAssetAmount(rawAmount: bigint | undefined, info: AssetInfo): string {
  if (rawAmount === undefined) return `0 ${info.unitName}`
  if (info.decimals === 0) return `${rawAmount} ${info.unitName}`
  const divisor = 10n ** BigInt(info.decimals)
  const whole = rawAmount / divisor
  const remainder = rawAmount % divisor
  if (remainder === 0n) return `${whole} ${info.unitName}`
  const frac = remainder.toString().padStart(info.decimals, '0').replace(/0+$/, '')
  return `${whole}.${frac} ${info.unitName}`
}

function assetLabel(txn: DecodedTransaction, info?: AssetInfo): string {
  if (info?.unitName) return info.unitName
  return `ASA#${txn.assetIndex}`
}

function TransactionFlow({ txn, assetInfo, appEscrows = {} }: TransactionFlowProps) {
  const resolveAddr = (full: string | undefined, short: string): string =>
    (full && appEscrows[full]) || short
  const renderFlowLine = (
    from: string,
    label: string,
    to: string,
    isDanger: boolean = false,
    isSecondary: boolean = false,
  ) => (
    <div className={`grid grid-cols-[1fr_auto_1fr] w-full items-center font-mono text-xs ${isSecondary ? 'mt-1' : ''}`}>
      <span className="text-[var(--wui-color-text-secondary)] text-left">{from}</span>
      <span className="flex items-center justify-center gap-1 px-1">
        <span className="text-[var(--wui-color-text-tertiary)]">--[</span>
        <span className={isDanger ? 'text-[var(--wui-color-danger-text)] font-bold' : 'text-[var(--wui-color-primary)] font-medium'}>
          {label}
        </span>
        <span className="text-[var(--wui-color-text-tertiary)]">]--&gt;</span>
      </span>
      <span className={`text-right ${isDanger ? 'text-[var(--wui-color-danger-text)] font-bold' : 'text-[var(--wui-color-text-secondary)]'}`}>{to}</span>
    </div>
  )

  const renderRemainderLine = (to: string) => (
    <div className="grid grid-cols-[1fr_auto_1fr] w-full items-center font-mono text-xs mt-1">
      <span />
      <span className="flex items-center justify-center gap-1 px-1">
        <span className="text-[var(--wui-color-text-tertiary)]">--[</span>
        <span className="text-[var(--wui-color-danger-text)] font-bold">remainder</span>
        <span className="text-[var(--wui-color-text-tertiary)]">]--&gt;</span>
      </span>
      <span className="text-[var(--wui-color-danger-text)] font-bold text-right">{to}</span>
    </div>
  )

  const renderRekeyLine = (from: string, to: string) => (
    <div className="grid grid-cols-[1fr_auto_1fr] w-full items-center font-mono text-xs mt-1">
      <span className="text-[var(--wui-color-text-secondary)] text-left">{from}</span>
      <span className="flex items-center justify-center gap-1 px-1">
        <span className="text-[var(--wui-color-text-tertiary)]">--[</span>
        <span className="text-[var(--wui-color-danger-text)] font-bold">REKEY</span>
        <span className="text-[var(--wui-color-text-tertiary)]">]--&gt;</span>
      </span>
      <span className="text-[var(--wui-color-danger-text)] font-bold text-right">{to}</span>
    </div>
  )

  return (
    <div className="space-y-0">
      {/* Payment transaction */}
      {txn.type === 'pay' && txn.receiverShort && (
        <>
          {renderFlowLine(txn.senderShort, txn.amount || '0 ALGO', resolveAddr(txn.receiver, txn.receiverShort))}
          {txn.closeRemainderToShort && renderRemainderLine(txn.closeRemainderToShort)}
        </>
      )}

      {/* Asset transfer */}
      {txn.type === 'axfer' && txn.receiverShort && (
        <>
          {renderFlowLine(
            txn.senderShort,
            assetInfo ? formatAssetAmount(txn.rawAmount, assetInfo) : `${txn.amount || '0'} ASA#${txn.assetIndex}`,
            resolveAddr(txn.receiver, txn.receiverShort),
          )}
          {txn.closeRemainderToShort && renderRemainderLine(txn.closeRemainderToShort)}
        </>
      )}

      {/* Asset freeze */}
      {txn.type === 'afrz' && txn.freezeTargetShort && (
        <>
          {renderFlowLine(
            txn.senderShort,
            `${txn.isFreezing ? 'Freeze' : 'Unfreeze'} ${assetLabel(txn, assetInfo)}`,
            txn.freezeTargetShort,
          )}
        </>
      )}

      {/* Asset config */}
      {txn.type === 'acfg' && (
        <>
          {renderFlowLine(
            txn.senderShort,
            `Configure ${txn.assetIndex ? assetLabel(txn, assetInfo) : 'NEW'}`,
            txn.senderShort,
          )}
        </>
      )}

      {/* Application call */}
      {txn.type === 'appl' && (
        <>
          {renderFlowLine(
            txn.senderShort,
            'APP CALL',
            `App ${txn.appIndex || 'NEW'}`,
          )}
        </>
      )}

      {/* Key registration */}
      {txn.type === 'keyreg' && (
        <>
          {renderFlowLine(txn.senderShort, 'KEY REG', txn.senderShort)}
        </>
      )}

      {/* Rekey (applies to any transaction type) */}
      {txn.rekeyToShort && renderRekeyLine(txn.senderShort, txn.rekeyToShort)}
    </div>
  )
}

export function BeforeSignDialog({ transactions, message, dangerous, onApprove, onReject, onClose }: BeforeSignDialogProps) {
  const { theme } = useWalletUI()
  const [animationState, setAnimationState] = useState<'starting' | 'entered' | 'exiting' | null>('starting')

  const dataTheme = theme === 'system' ? undefined : theme

  const { refs, context } = useFloating({
    open: true,
    onOpenChange: (open) => {
      if (!open) {
        setAnimationState('exiting')
        if (dangerous) {
          setTimeout(() => onReject(), 150)
        } else {
          setTimeout(() => onClose(), 150)
        }
      }
    },
  })

  const assetIds = useMemo(() => {
    const ids = new Set<string>()
    for(const txn of transactions) {
      if (txn.assetIndex) {
        ids.add(txn.assetIndex.toString())
      }
    }
    return Array.from(ids)
  }, [transactions])

  const { loading, assets } = useAssets(assetIds)

  const appEscrows = useMemo(() => {
    const escrows: Record<string, string> = {}
    for (const txn of transactions) {
      if (txn.type === 'appl' && txn.appIndex) {
        const escrowAddr = getApplicationAddress(txn.appIndex)
        escrows[escrowAddr.toString()] = `App ${txn.appIndex}`
      }
    }
    return escrows
  }, [transactions])

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
                <h2 id={labelId} className={`text-lg font-bold wallet-custom-font ${dangerous ? 'text-[var(--wui-color-danger-text)]' : 'text-[var(--wui-color-text)]'}`}>
                  {dangerous ? 'Review Dangerous ' : 'Review '}Transaction{transactions.length > 1 ? 's' : ''}
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

              <div className="px-4 pb-4">
                <div className="text-sm flex flex-col gap-2 border border-[var(--wui-color-border)] rounded-xl p-3">
                  <div>Transaction ID to sign:</div>
                  <div className="font-mono break-all text-[var(--wui-color-danger-text)]">{message}</div>
                  <div>Ensure the transaction ID is correct before approving.</div>
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
                    className="flex-1 py-2.5 px-4 bg-[var(--wui-color-danger-text)] text-white font-medium rounded-xl hover:brightness-90 transition-all text-sm"
                  >
                    Sign (Dangerous)
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
