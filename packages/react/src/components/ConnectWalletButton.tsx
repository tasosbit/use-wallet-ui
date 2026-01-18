import React from 'react'

import { cn } from '../utils'

export interface ConnectWalletButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  style?: React.CSSProperties
}

export const ConnectWalletButton = React.forwardRef<
  HTMLButtonElement,
  ConnectWalletButtonProps
>(({ className = '', children, style, ...props }, ref) => {
  // Style for the connect button using CSS custom properties for theming
  const connectButtonStyles =
    'bg-[var(--wui-color-primary)] transition-colors hover:bg-[var(--wui-color-primary-hover)] text-[var(--wui-color-primary-text)] font-bold py-2.5 px-4 rounded-xl cursor-pointer disabled:opacity-50 wallet-custom-font'

  return (
    <button
      ref={ref}
      className={cn(connectButtonStyles, className)}
      style={style}
      {...props}
      type="button"
    >
      {children || 'Connect Wallet'}
    </button>
  )
})

ConnectWalletButton.displayName = 'ConnectWalletButton'
