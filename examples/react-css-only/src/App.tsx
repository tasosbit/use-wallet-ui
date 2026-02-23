import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from '@txnlab/use-wallet-react'
import {
  WalletButton,
  WalletUIProvider,
  type Theme,
} from '@txnlab/use-wallet-ui-react'
import { useState, useEffect } from 'react'

import { WalletInfo } from './components/WalletInfo'

import '@txnlab/use-wallet-ui-react/dist/style.css' // Import the pre-built CSS file
import './App.css'

const walletManager = new WalletManager({
  wallets: [
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.LUTE,
    WalletId.EXODUS,
    {
      id: WalletId.WALLETCONNECT,
      options: { projectId: 'fcfde0713d43baa0d23be0773c80a72b' },
    },
  ],
  defaultNetwork: NetworkId.TESTNET,
})

function App() {
  const [theme, setTheme] = useState<Theme>('system')

  // Sync app theme with the theme switcher
  // This adds/removes a 'dark' class on the root element
  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  return (
    <WalletProvider manager={walletManager}>
      <WalletUIProvider theme={theme}>
        <div className="app-wrapper">
          {/* Header */}
          <header className="header">
            <div className="header-container">
              <div className="header-content">
                <div className="logo-container">
                  <span className="logo-text">use-wallet-ui</span>
                </div>
                <div className="wallet-controls">
                  {/* Theme selector */}
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as Theme)}
                    className="theme-select"
                  >
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                  <WalletButton />
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="main-content">
            <div className="title-section">
              <h1 className="main-title">React Components for use-wallet</h1>
              <p className="description">
                A simple example demonstrating wallet connection, NFD profile
                integration, and balance display using the{' '}
                <code className="code-block">@txnlab/use-wallet-ui-react</code>{' '}
                package.
              </p>
              <p className="theme-info">
                Current theme: <code className="code-block">{theme}</code>
              </p>
            </div>

            {/* Account Info */}
            <WalletInfo />

            {/* Documentation Link */}
            <div className="footer">
              <p className="footer-text">
                View the{' '}
                <a
                  href="https://github.com/TxnLab/use-wallet-ui"
                  className="documentation-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  documentation
                </a>{' '}
                to learn more about implementing wallet integration in your
                dApp.
              </p>
            </div>
          </main>
        </div>
      </WalletUIProvider>
    </WalletProvider>
  )
}

export default App
