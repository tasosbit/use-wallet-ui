import { useState } from 'react'
import { AlgoSymbol } from './AlgoSymbol'
import { OptInPanel, type OptInPanelProps } from './OptInPanel'
import { SendPanel, type SendPanelProps } from './SendPanel'

export interface ManagePanelProps {
  displayBalance: number | null
  showAvailableBalance: boolean
  onToggleBalance: () => void
  onBack: () => void
  send?: Omit<SendPanelProps, 'onBack'>
  optIn?: Omit<OptInPanelProps, 'onBack'>
  onBridge?: () => void
  onExplore?: () => void
}

const balanceFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

export function ManagePanel({
  displayBalance,
  showAvailableBalance,
  onToggleBalance,
  onBack,
  send,
  optIn,
  onBridge,
  onExplore,
}: ManagePanelProps) {
  const [mode, setMode] = useState<'main' | 'send' | 'opt-in'>('main')

  const backToMain = (resetFn?: () => void) => {
    setMode('main')
    resetFn?.()
  }

  if (mode === 'send' && send) {
    return <SendPanel {...send} onBack={() => backToMain(send.reset)} />
  }

  if (mode === 'opt-in' && optIn) {
    return <OptInPanel {...optIn} onBack={() => backToMain(optIn.reset)} />
  }

  return (
    <>
      {/* Header with back arrow */}
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
        <h3 className="text-lg font-bold leading-none text-[var(--wui-color-text)] wallet-custom-font">
          Manage Liquid Account
        </h3>
      </div>

      {/* Balance display */}
      <div className="mb-4 bg-[var(--wui-color-bg-secondary)] rounded-lg p-3">
        <div className="flex justify-between items-center">
          {displayBalance !== null && (
            <span className="text-base font-medium text-[var(--wui-color-text)] flex items-center gap-1">
              {balanceFormatter.format(displayBalance)}
              <AlgoSymbol />
            </span>
          )}
          <button
            onClick={onToggleBalance}
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

      {/* Divider */}
      <div className="border-t border-[var(--wui-color-border)] mb-3" />

      {/* Action buttons grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setMode('send')}
          disabled={!send}
          className="py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          Send
        </button>
        <button
          onClick={() => setMode('opt-in')}
          disabled={!optIn}
          className="py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Opt In
        </button>
        <button
          onClick={onBridge}
          disabled={!onBridge}
          className="py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3l4 4-4 4" />
            <path d="M16 3l-4 4 4 4" />
            <path d="M12 7H4" />
            <path d="M12 7h8" />
            <path d="M8 21l4-4-4-4" />
            <path d="M16 21l-4-4 4-4" />
            <path d="M12 17H4" />
            <path d="M12 17h8" />
          </svg>
          Bridge
        </button>
        <button
          onClick={onExplore}
          disabled={!onExplore}
          className="py-2.5 px-4 bg-[var(--wui-color-bg-tertiary)] text-[var(--wui-color-text)] font-medium rounded-xl hover:brightness-90 transition-all text-sm flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Explore
        </button>
      </div>
    </>
  )
}
