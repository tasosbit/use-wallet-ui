import {
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useFloating,
  useId,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'

import { useNotice } from '@d13co/algo-x-evm-ui'

import { useWalletUI } from '../providers/WalletUIProvider'

interface EvmConnectDisclaimerProps {
  onCancel?: () => void
}

/**
 * Internal gate rendered inside the RainbowKit/wagmi provider tree. When the
 * consumer supplies a `'evm-connect'` notice on WalletUIProvider and the user
 * has an active EVM session they haven't acknowledged, this shows a modal
 * disclaimer over the app. Accepting marks it acknowledged (persisted);
 * cancelling disconnects the wagmi session without marking it acknowledged,
 * so the gate re-appears on the next connect.
 */
export function EvmConnectDisclaimer({ onCancel }: EvmConnectDisclaimerProps = {}) {
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { config, isAcknowledged, acknowledge } = useNotice('evm-connect')
  const { theme } = useWalletUI()
  const [checked, setChecked] = useState(false)

  const active = isConnected && !!config && config.kind === 'disclaimer' && !isAcknowledged

  const { refs, context } = useFloating({ open: active })
  const role = useRole(context, { role: 'alertdialog' })
  const { getFloatingProps } = useInteractions([role])

  const labelId = useId()
  const descriptionId = useId()

  if (!active) return null

  const dataTheme = theme === 'system' ? undefined : theme

  const handleAccept = () => {
    acknowledge()
    setChecked(false)
  }

  const handleCancel = () => {
    setChecked(false)
    disconnect()
    onCancel?.()
  }

  return (
    <FloatingPortal id="wallet-evm-connect-disclaimer-portal">
      <div data-wallet-theme data-wallet-ui data-theme={dataTheme}>
        <FloatingOverlay
          className="grid place-items-center px-4 z-[110] bg-[var(--wui-color-overlay)]"
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
              className="w-full max-w-md rounded-3xl bg-[var(--wui-color-bg)] shadow-xl"
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h2 id={labelId} className="text-lg font-bold text-[var(--wui-color-text)] wallet-custom-font">
                  Before you continue
                </h2>
                <button
                  onClick={handleCancel}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] hover:brightness-90 transition-all"
                  aria-label="Cancel and disconnect"
                  title="Cancel and disconnect"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div id={descriptionId} className="px-6 pb-3 text-sm leading-relaxed text-[var(--wui-color-text)]">
                {config.text}
              </div>
              <label className="mx-6 mb-4 flex items-start gap-2 cursor-pointer text-sm select-none text-[var(--wui-color-text)]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--wui-color-primary)]"
                />
                <span>I understand the risks and wish to proceed</span>
              </label>
              <div className="px-6 py-4 border-t border-[var(--wui-color-border)] flex gap-2">
                <button
                  onClick={handleCancel}
                  className="w-full py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!checked}
                  className="w-full py-2.5 px-4 bg-[var(--wui-color-primary)] text-[var(--wui-color-primary-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
                >
                  Accept
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      </div>
    </FloatingPortal>
  )
}
