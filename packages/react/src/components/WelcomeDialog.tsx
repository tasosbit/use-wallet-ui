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
import { useCallback, useState } from 'react'

import { useWalletUI } from '../providers/WalletUIProvider'

interface WelcomeDialogProps {
  algorandAddress: string
  evmAddress: string
  onDismiss: () => void
}

export function WelcomeDialog({ algorandAddress, evmAddress, onDismiss }: WelcomeDialogProps) {
  const { theme } = useWalletUI()
  const [animationState, setAnimationState] = useState<'starting' | 'entered' | 'exiting' | null>('starting')
  const [copiedField, setCopiedField] = useState<'evm' | 'algorand' | null>(null)

  const handleCopy = useCallback((address: string, field: 'evm' | 'algorand') => {
    navigator.clipboard.writeText(address)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }, [])

  const dataTheme = theme === 'system' ? undefined : theme

  const { refs, context } = useFloating({
    open: true,
    onOpenChange: (open) => {
      if (!open) {
        setAnimationState('exiting')
        setTimeout(() => onDismiss(), 150)
      }
    },
  })

  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' })
  const role = useRole(context, { role: 'dialog' })
  const { getFloatingProps } = useInteractions([dismiss, role])

  const labelId = useId()
  const descriptionId = useId()

  // Trigger enter animation
  if (animationState === 'starting') {
    requestAnimationFrame(() => setAnimationState('entered'))
  }

  const shortAlgorandAddress = `${algorandAddress.slice(0, 6)}...${algorandAddress.slice(-6)}`
  const shortEvmAddress = `${evmAddress.slice(0, 6)}...${evmAddress.slice(-6)}`

  return (
    <FloatingPortal id="wallet-welcome-dialog-portal">
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
              role="dialog"
              data-state={animationState}
              className="w-full max-w-md rounded-3xl bg-[var(--wui-color-bg)] shadow-xl transform transition-all duration-150 ease-in-out data-[state=starting]:opacity-0 data-[state=starting]:scale-90 data-[state=exiting]:opacity-0 data-[state=exiting]:scale-90 data-[state=entered]:opacity-100 data-[state=entered]:scale-100"
              style={{ marginTop: '-0.5rem' }}
            >
              {/* Header */}
              <div className="relative flex items-center px-6 pt-5 pb-4">
                <h2 id={labelId} className="text-xl font-bold text-[var(--wui-color-text)] wallet-custom-font">
                  Welcome to Algorand
                </h2>
                <button
                  onClick={() => {
                    setAnimationState('exiting')
                    setTimeout(() => onDismiss(), 150)
                  }}
                  className="absolute right-4 top-5 w-9 h-9 flex items-center justify-center rounded-full bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] hover:brightness-90 transition-all"
                  aria-label="Close dialog"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div id={descriptionId} className="px-6 pb-4 space-y-4">
                <p className="text-sm text-[var(--wui-color-text-secondary)]">
                  You can use Algorand with your very own Liquid EVM account, which wraps your EVM private key, preserving full
                  self-custodial control.{' '}
                  <a
                    className="text-[var(--wui-color-link)] hover:text-[var(--wui-color-link-hover)]"
                    rel="noopener noreferrer"
                    href="#"
                    onClick={() => {
                      alert('Soon')
                      return false
                    }}
                  >
                    Learn more.
                  </a>
                </p>

                <div className="!my-4 rounded-xl border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--wui-color-text-tertiary)]">Your EVM Address</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[var(--wui-color-text-secondary)] font-mono">{shortEvmAddress}</span>
                      <button
                        onClick={() => handleCopy(evmAddress, 'evm')}
                        className="text-[var(--wui-color-text-tertiary)] hover:text-[var(--wui-color-text-secondary)] transition-colors"
                        aria-label="Copy EVM address"
                      >
                        {copiedField === 'evm' ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        )}
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--wui-color-text-tertiary)]">Your Algorand Address</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[var(--wui-color-text-secondary)] font-mono">{shortAlgorandAddress}</span>
                      <button
                        onClick={() => handleCopy(algorandAddress, 'algorand')}
                        className="text-[var(--wui-color-text-tertiary)] hover:text-[var(--wui-color-text-secondary)] transition-colors"
                        aria-label="Copy Algorand address"
                      >
                        {copiedField === 'algorand' ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                        )}
                      </button>
                    </span>
                  </div>
                </div>

                <p className="text-sm text-[var(--wui-color-text-secondary)]">
                  To get started,{' '}
                  <a className="text-[var(--wui-color-link)] hover:text-[var(--wui-color-link-hover)]" rel="noopener noreferrer" target="_blank" href="https://algorand.co/ecosystem/directory?tags=CEX">
                    fund
                  </a>{' '}
                  your new Algorand account via CEX, Card onramp, or{' '}
                  <a className="text-[var(--wui-color-link)] hover:text-[var(--wui-color-link-hover)]" rel="noopener noreferrer" target="_blank" href="https://core.allbridge.io/?ft=USDC&tt=USDC&f=BAS&t=ALG">
                    bridge USDC
                  </a>{' '}
                  in 2 minutes.
                </p>
              </div>

              {/* Action buttons */}
              <div className="px-6 py-4 border-t border-[var(--wui-color-border)] flex flex gap-2">
                <button
                  onClick={() => {
                    setAnimationState('exiting')
                    setTimeout(() => onDismiss(), 150)
                    window.open('https://algorand.co/algorand-start-here#hs_cos_wrapper_widget_1769533007886')
                  }}
                  className="w-full py-2.5 px-4 bg-[var(--wui-color-primary)] text-[var(--wui-color-primary-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm"
                >
                  Get Started
                </button>
                <button
                  onClick={() => {
                    setAnimationState('exiting')
                    setTimeout(() => onDismiss(), 150)
                  }}
                  className="w-full py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] font-medium rounded-xl hover:brightness-90 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      </div>
    </FloatingPortal>
  )
}
