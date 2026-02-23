import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from '@txnlab/use-wallet-react'
import {
  WalletUIProvider,
  WalletButton,
  type Theme,
} from '@txnlab/use-wallet-ui-react'
import { useState, useEffect } from 'react'

import { WalletInfo } from './components/WalletInfo'

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
  // This adds/removes a 'dark' class on the root element for Tailwind
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
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
          {/* Header */}
          <header className="w-full bg-white dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700/50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex-shrink-0">
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    use-wallet-ui
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {/* Theme selector */}
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as Theme)}
                    className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
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

          {/* Content area */}
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                React Components for use-wallet
              </h1>
              <p className="text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
                A simple example demonstrating wallet connection, NFD profile
                integration, and balance display using the{' '}
                <code className="text-sm bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  @txnlab/use-wallet-ui-react
                </code>{' '}
                package.
              </p>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-4">
                Current theme:{' '}
                <code className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                  {theme}
                </code>
              </p>
            </div>

            <WalletInfo />

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                View the{' '}
                <a
                  href="https://github.com/TxnLab/use-wallet-ui"
                  className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
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
