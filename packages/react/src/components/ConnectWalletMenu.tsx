import {
  useFloating,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  FloatingFocusManager,
  FloatingOverlay,
  FloatingPortal,
  useMergeRefs,
  useId,
} from '@floating-ui/react'
import { useWallet } from '@txnlab/use-wallet-react'
import React, { ReactElement, RefObject, useState } from 'react'

import { useWalletUI } from '../providers/WalletUIProvider'

import { ConnectWalletButton } from './ConnectWalletButton'
import { WalletList } from './WalletList'

import type { Wallet } from '@txnlab/use-wallet-react'

// A more specific type for the children that includes ref
type RefableElement = ReactElement & {
  ref?: RefObject<HTMLElement> | ((instance: HTMLElement | null) => void)
}

export interface ConnectWalletMenuProps {
  children?: RefableElement
}

export function ConnectWalletMenu({ children }: ConnectWalletMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [animationState, setAnimationState] = useState<
    'starting' | 'entered' | 'exiting' | null
  >(null)

  const { wallets, activeAddress } = useWallet()
  const { theme } = useWalletUI()

  // Determine the data-theme attribute for the portal
  // Only set explicit themes, let 'system' use media query fallback
  const dataTheme = theme === 'system' ? undefined : theme

  const { refs, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      // Don't open dialog if already connected
      if (open && activeAddress) return

      if (open) {
        setIsOpen(true)
        setAnimationState('starting')

        // Start entry animation
        requestAnimationFrame(() => {
          setAnimationState('entered')
        })
      } else {
        // Start exit animation
        setAnimationState('exiting')

        // Remove component after animation completes
        setTimeout(() => {
          setIsOpen(false)
          setAnimationState(null)
        }, 150)
      }
    },
  })

  // Interaction hooks
  const click = useClick(context)
  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' })
  const role = useRole(context, { role: 'dialog' })

  // Merge interaction props
  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ])

  // Accessibility IDs
  const labelId = useId()
  const descriptionId = useId()

  const handleWalletClick = async (wallet: Wallet) => {
    try {
      await wallet.connect()
      context.onOpenChange(false)
    } catch (error) {
      console.error(`Error connecting to ${wallet.metadata.name}:`, error)
      context.onOpenChange(false)
    }
  }

  // Always add click handler to trigger, but make it a no-op if connected
  const handleTriggerClick = (_e: React.MouseEvent) => {
    if (activeAddress) {
      // Do nothing if connected - let the event bubble up to potential parent handlers
      return
    }
    // Otherwise open the dialog directly
    context.onOpenChange(true)
  }

  // If no children are provided, create a default connect button
  const triggerElement = children || <ConnectWalletButton />

  const triggerRef = useMergeRefs([
    refs.setReference,
    (triggerElement as RefableElement).ref || null,
  ])

  const referenceProps = {
    ...getReferenceProps(),
    ref: triggerRef,
    onClick: handleTriggerClick,
  }

  // Clone the trigger element with the reference props
  const trigger = React.cloneElement(triggerElement, referenceProps)

  return (
    <>
      {trigger}
      <FloatingPortal id="wallet-dialog-portal">
        {isOpen && (
          <div data-wallet-ui data-theme={dataTheme}>
            <FloatingOverlay
              className="grid place-items-center px-4 z-50 transition-opacity duration-150 ease-in-out bg-[var(--wui-color-overlay)] data-[state=starting]:opacity-0 data-[state=exiting]:opacity-0 data-[state=entered]:opacity-100"
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
                  className="w-full max-w-sm rounded-3xl bg-[var(--wui-color-bg)] shadow-xl transform transition-all duration-150 ease-in-out data-[state=starting]:opacity-0 data-[state=starting]:scale-90 data-[state=exiting]:opacity-0 data-[state=exiting]:scale-90 data-[state=entered]:opacity-100 data-[state=entered]:scale-100"
                  style={{
                    marginTop: '-0.5rem',
                  }}
                >
                  {/* Header */}
                  <div className="relative flex items-center px-6 pt-5 pb-4">
                    <h2
                      id={labelId}
                      className="text-xl font-bold text-[var(--wui-color-text)] wallet-custom-font"
                    >
                      Connect a Wallet
                    </h2>
                    {/* Close button */}
                    <button
                      onClick={() => context.onOpenChange(false)}
                      className="absolute right-4 rounded-full bg-[var(--wui-color-bg-tertiary)] p-2 text-[var(--wui-color-text-secondary)] hover:brightness-90 transition-all"
                      aria-label="Close dialog"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Wallet list */}
                  <div className="px-4 pb-3">
                    <WalletList
                      wallets={wallets}
                      handleWalletClick={handleWalletClick}
                    />
                  </div>

                  {/* Footer section */}
                  <div className="px-6 py-5 border-t border-[var(--wui-color-border)] flex items-center justify-between">
                    <span className="text-[var(--wui-color-text-secondary)] text-sm">
                      Need an Algorand wallet?
                    </span>
                    <a
                      href="https://algorand.co/wallets"
                      className="text-[var(--wui-color-link)] font-medium text-sm hover:text-[var(--wui-color-link-hover)]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Start here →
                    </a>
                  </div>
                </div>
              </FloatingFocusManager>
            </FloatingOverlay>
          </div>
        )}
      </FloatingPortal>
    </>
  )
}
