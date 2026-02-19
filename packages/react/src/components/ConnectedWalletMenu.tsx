import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  flip,
  shift,
  autoUpdate,
  useId,
} from '@floating-ui/react'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useWallet } from '@txnlab/use-wallet-react'
import { formatNumber, formatShortAddress } from '@txnlab/utils-ts'
import React, { ReactElement, RefObject, useState } from 'react'

import { AlgoSymbol, ManagePanel } from '@d13co/liquid-ui'

import { useAccountInfo } from '../hooks/useAccountInfo'
import { useNfd } from '../hooks/useNfd'
import { useOptIn } from '../hooks/useOptIn'
import { useSend } from '../hooks/useSend'
import { useWalletUI } from '../providers/WalletUIProvider'
import { ConnectedWalletButton } from './ConnectedWalletButton'
import { NfdAvatar } from './NfdAvatar'

// A more specific type for the children that includes ref
type RefableElement = ReactElement & {
  ref?: RefObject<HTMLElement> | ((instance: HTMLElement | null) => void)
}

export interface ConnectedWalletMenuProps {
  children?: RefableElement
}

function ConnectedWalletMenuContent({ children }: ConnectedWalletMenuProps) {
  const { activeAddress, activeWallet } = useWallet()
  const { theme } = useWalletUI()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'main' | 'manage'>('main')
  const [isCopied, setIsCopied] = useState(false)

  const optIn = useOptIn()
  const send = useSend()

  const [showAvailableBalance, setShowAvailableBalance] = useState(() => {
    const stored = localStorage.getItem('uwui:balance-preference')
    return stored ? stored === 'available' : false
  })

  const dataTheme = theme === 'system' ? undefined : theme

  const nfdQuery = useNfd({ enabled: !!activeAddress })
  const nfdName = nfdQuery.data?.name ?? null

  const { data: accountInfo } = useAccountInfo({ enabled: !!activeAddress })

  const totalBalance = React.useMemo(() => {
    if (!accountInfo || accountInfo.amount === undefined) return null
    return Number(accountInfo.amount) / 1_000_000
  }, [accountInfo])

  const availableBalance = React.useMemo(() => {
    if (!accountInfo || accountInfo.amount === undefined || accountInfo.minBalance === undefined) return null
    const available = Number(accountInfo.amount) - Number(accountInfo.minBalance)
    return Math.max(0, available / 1_000_000)
  }, [accountInfo])

  const displayBalance = showAvailableBalance ? availableBalance : totalBalance

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      setIsOpen(open)
      if (!open) {
        setMode('main')
        optIn.reset()
        send.reset()
      }
    },
    placement: 'bottom-end',
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' })
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  const labelId = useId()

  const handleCopyAddress = () => {
    if (activeAddress) {
      navigator.clipboard.writeText(activeAddress)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleDisconnect = async () => {
    if (activeWallet) {
      try {
        await activeWallet.disconnect()
        setIsOpen(false)
      } catch (error) {
        console.error('Error disconnecting wallet:', error)
      }
    }
  }

  const handleAccountChange = (accountAddress: string) => {
    if (activeWallet && activeWallet.setActiveAccount) {
      activeWallet.setActiveAccount(accountAddress)
    }
  }

  const toggleBalanceView = () => {
    const newValue = !showAvailableBalance
    setShowAvailableBalance(newValue)
    localStorage.setItem('uwui:balance-preference', newValue ? 'available' : 'total')
  }

  // Shared balance display with toggle
  const balanceDisplay = (
    <div className="mb-4 bg-[var(--wui-color-bg-secondary)] rounded-lg p-3">
      <div className="flex justify-between items-center">
        {displayBalance !== null && (
          <span className="text-base font-medium text-[var(--wui-color-text)] flex items-center gap-1">
            {formatNumber(displayBalance, { fractionDigits: 4 })}
            <AlgoSymbol />
          </span>
        )}
        <button
          onClick={toggleBalanceView}
          className="flex items-center gap-1 text-sm text-[var(--wui-color-text-secondary)] bg-[var(--wui-color-bg-tertiary)] py-1 pl-2.5 pr-2 rounded-md hover:brightness-90 transition-all focus:outline-none"
          title={showAvailableBalance ? 'Show total balance' : 'Show available balance'}
        >
          {showAvailableBalance ? 'Available' : 'Total'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-0.5 opacity-80"
          >
            <path d="m17 10-5-5-5 5" />
            <path d="m17 14-5 5-5-5" />
          </svg>
        </button>
      </div>
    </div>
  )

  const triggerElement = children || <ConnectedWalletButton />
  const trigger = React.cloneElement(triggerElement, getReferenceProps({ ref: refs.setReference }))

  return (
    <>
      {trigger}
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div data-wallet-theme data-wallet-ui data-theme={dataTheme}>
              <div
                ref={refs.setFloating}
                style={{ ...floatingStyles, width: mode === 'main' ? 320 : 384 }}
                {...getFloatingProps()}
                role="menu"
                aria-labelledby={labelId}
                className="z-50 rounded-xl bg-[var(--wui-color-bg)] shadow-xl border border-[var(--wui-color-border)] transition-[width] duration-200 ease-in-out"
              >
                <div className="p-4">
                  {mode === 'main' ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-12 w-12 overflow-hidden">
                          <NfdAvatar nfd={nfdQuery.data} alt={`${nfdName || activeAddress} avatar`} size={48} />
                        </div>
                        <div>
                          <h3
                            id={labelId}
                            className="text-lg font-bold text-[var(--wui-color-text)] max-w-[220px] truncate wallet-custom-font"
                          >
                            {nfdName || (activeAddress ? formatShortAddress(activeAddress, 6, 4) : 'My Wallet')}
                          </h3>
                          {nfdName && activeAddress && (
                            <p className="text-sm text-[var(--wui-color-text-secondary)]">{formatShortAddress(activeAddress, 6, 4)}</p>
                          )}
                        </div>
                      </div>

                      {balanceDisplay}

                      {/* Account selector (when multiple accounts available) */}
                      {activeWallet && activeWallet.accounts && activeWallet.accounts.length > 1 && (
                        <div className="mb-4">
                          <Listbox value={activeAddress || ''} onChange={handleAccountChange}>
                            <Label className="block text-sm font-medium text-[var(--wui-color-text-secondary)] mb-1">Select Account</Label>
                            <div className="relative mt-1">
                              <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg border border-[var(--wui-color-border)] bg-[var(--wui-color-bg-secondary)] py-2 px-3 text-left text-[var(--wui-color-text)] shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--wui-color-primary)] focus:border-transparent text-sm">
                                <span className="col-start-1 row-start-1 truncate pr-8">
                                  {activeAddress ? formatShortAddress(activeAddress, 6, 4) : 'Select account'}
                                </span>
                                <span className="col-start-1 row-start-1 self-center justify-self-end">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    className="text-[var(--wui-color-text-secondary)]"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M4 6L8 10L12 6"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </ListboxButton>
                              <ListboxOptions
                                transition
                                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[var(--wui-color-bg-secondary)] py-1 shadow-lg ring-1 ring-black/5 focus:outline-none text-sm data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in"
                              >
                                {activeWallet.accounts.map((account) => (
                                  <ListboxOption
                                    key={account.address}
                                    value={account.address}
                                    className="group relative cursor-default select-none py-2 pl-3 pr-9 text-[var(--wui-color-text)] data-[focus]:bg-[var(--wui-color-bg-hover)] data-[focus]:outline-none"
                                  >
                                    <span className="block truncate font-normal group-data-[selected]:font-medium">
                                      {formatShortAddress(account.address, 6, 4)}
                                    </span>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--wui-color-primary)] group-[&:not([data-selected])]:hidden">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        className="h-5 w-5"
                                        aria-hidden="true"
                                      >
                                        <path
                                          d="M13.3334 4L6.00008 11.3333L2.66675 8"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </span>
                                  </ListboxOption>
                                ))}
                              </ListboxOptions>
                            </div>
                          </Listbox>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-[var(--wui-color-border)] mt-2 mb-2" />

                      {/* Wallet info section */}
                      {activeWallet && (
                        <div className="mb-2 flex justify-between">
                          <div className="flex items-center gap-2 px-1 py-0.5">
                            <div className="h-5 w-5 overflow-hidden rounded flex items-center justify-center">
                              {activeWallet.metadata.icon ? (
                                <img
                                  src={activeWallet.metadata.icon}
                                  alt={`${activeWallet.metadata.name} icon`}
                                  className="max-w-full max-h-full"
                                />
                              ) : (
                                <div className="h-5 w-5 rounded-full bg-[var(--wui-color-bg-tertiary)] flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 text-[var(--wui-color-text-tertiary)]"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M17 9c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h4c.55 0 1-.45 1-1V9zm-1 0v8h-4V9h4zM8 4c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v13c0 .55.45 1 1 1h4c.55 0 1-.45 1-1V4zM3 3h4v14H3V3z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-[var(--wui-color-text-secondary)]">{activeWallet.metadata.name}</p>
                          </div>
                          <div>
                            {
                              // @ts-ignore
                              activeWallet.metadata.isLiquid && (
                                <button
                                  onClick={() => setMode('manage')}
                                  className="flex-1 py-2 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] font-medium rounded-xl hover:brightness-90 transition-all text-sm flex items-center justify-center"
                                  title="Manage Liquid Account"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
                                  Manage
                                </button>
                              )
                            }
                          </div>
                        </div>
                      )}

                      {/* Divider */}
                      <div className="border-t border-[var(--wui-color-border)] mb-3 mt-2" />

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyAddress}
                          className="flex-1 py-2 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text-secondary)] font-medium rounded-xl hover:brightness-90 transition-all text-sm flex items-center justify-center"
                          title="Copy address"
                        >
                          {isCopied ? (
                            <>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-green-500 mr-1.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleDisconnect}
                          className="flex-1 py-2 px-4 bg-[var(--wui-color-danger-bg)] text-[var(--wui-color-danger-text)] font-medium rounded-xl hover:bg-[var(--wui-color-danger-bg-hover)] transition-colors text-sm"
                        >
                          Disconnect
                        </button>
                      </div>
                    </>
                  ) : (
                    <ManagePanel
                      displayBalance={displayBalance}
                      showAvailableBalance={showAvailableBalance}
                      onToggleBalance={toggleBalanceView}
                      onBack={() => setMode('main')}
                      send={send}
                      optIn={optIn}
                    />
                  )}
                </div>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}

// Need to provide the QueryClientProvider here because FloatingPortal breaks context inheritance
export function ConnectedWalletMenu(props: ConnectedWalletMenuProps) {
  const { queryClient } = useWalletUI()

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectedWalletMenuContent {...props} />
    </QueryClientProvider>
  )
}
