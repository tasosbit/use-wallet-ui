import React from 'react'

import { cn } from '../utils'

export type ButtonSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-1.5 px-3 text-sm rounded-lg',
  md: 'py-2.5 px-4 text-base rounded-xl',
  lg: 'py-3 px-5 text-lg rounded-xl',
}

export interface ConnectWalletButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Size variant for the button */
  size?: ButtonSize
  style?: React.CSSProperties
}

export const ConnectWalletButton = React.forwardRef<
  HTMLButtonElement,
  ConnectWalletButtonProps
>(({ className = '', children, style, size = 'md', ...props }, ref) => {
  // Base styles using CSS custom properties for theming
  const baseStyles =
    'bg-[var(--wui-color-primary)] transition-colors hover:bg-[var(--wui-color-primary-hover)] text-[var(--wui-color-primary-text)] font-bold cursor-pointer disabled:opacity-50 wallet-custom-font'

  return (
    <button
      ref={ref}
      data-wallet-ui
      data-wallet-button
      className={cn(baseStyles, sizeClasses[size], className)}
      style={style}
      {...props}
      type="button"
    >
      {children || 'Connect Wallet'}
    </button>
  )
})

ConnectWalletButton.displayName = 'ConnectWalletButton'
