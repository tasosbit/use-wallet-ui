import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
  useWallet,
} from '@txnlab/use-wallet-react'
import {
  WalletButton,
  WalletUIProvider,
  ConnectWalletMenu,
  ConnectedWalletMenu,
  type Theme,
} from '@txnlab/use-wallet-ui-react'
import { formatShortAddress } from '@txnlab/utils-ts'
import { useState, useEffect } from 'react'

// Import pre-built CSS (this is the CSS-only approach, no Tailwind required)
import '@txnlab/use-wallet-ui-react/dist/style.css'
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

// Custom button component to demonstrate full customization
function CustomTriggerButton() {
  const { activeAddress } = useWallet()

  if (activeAddress) {
    return (
      <ConnectedWalletMenu>
        <button className="custom-button custom-button-connected">
          <span className="custom-button-dot" />
          {formatShortAddress(activeAddress, 4, 4)}
        </button>
      </ConnectedWalletMenu>
    )
  }

  return (
    <ConnectWalletMenu>
      <button className="custom-button">Connect</button>
    </ConnectWalletMenu>
  )
}

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
        <div className="app">
          {/* Header */}
          <header className="header">
            <div className="header-content">
              <h1 className="logo">Customization Examples</h1>
              <div className="header-controls">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                  className="theme-select"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </header>

          <main className="main">
            {/* Introduction */}
            <section className="section">
              <h2 className="section-title">CSS Customization Patterns</h2>
              <p className="section-description">
                This example demonstrates various ways to customize the wallet
                UI components without using Tailwind CSS. All customization is
                done via CSS variables, direct CSS overrides, and props.
              </p>
            </section>

            {/* Example 1: Default Button */}
            <section className="section">
              <h3 className="example-title">1. Default Button (No Customization)</h3>
              <p className="example-description">
                The default WalletButton with no customization.
              </p>
              <div className="example-demo">
                <WalletButton />
              </div>
              <pre className="code-block">{`<WalletButton />`}</pre>
            </section>

            {/* Example 2: Size Variants */}
            <section className="section">
              <h3 className="example-title">2. Size Variants</h3>
              <p className="example-description">
                Use the <code>size</code> prop to change button size.
              </p>
              <div className="example-demo example-demo-row">
                <div className="size-example">
                  <span className="size-label">Small</span>
                  <WalletButton size="sm" />
                </div>
                <div className="size-example">
                  <span className="size-label">Medium (default)</span>
                  <WalletButton size="md" />
                </div>
                <div className="size-example">
                  <span className="size-label">Large</span>
                  <WalletButton size="lg" />
                </div>
              </div>
              <pre className="code-block">{`<WalletButton size="sm" />
<WalletButton size="md" />
<WalletButton size="lg" />`}</pre>
            </section>

            {/* Example 3: CSS Variable Overrides (Global) */}
            <section className="section">
              <h3 className="example-title">3. CSS Variable Overrides (Global)</h3>
              <p className="example-description">
                Override CSS variables globally in your stylesheet. See{' '}
                <code>App.css</code> for the purple button styles.
              </p>
              <div className="example-demo purple-theme">
                <WalletButton />
              </div>
              <pre className="code-block">{`/* In your CSS file */
.purple-theme {
  --wui-color-primary: #8b5cf6;
  --wui-color-primary-hover: #7c3aed;
  --wui-color-primary-text: #ffffff;
}`}</pre>
            </section>

            {/* Example 4: Inline Style Overrides */}
            <section className="section">
              <h3 className="example-title">4. Inline Style Overrides</h3>
              <p className="example-description">
                Use the <code>style</code> prop to override CSS variables for a
                single instance.
              </p>
              <div className="example-demo">
                <WalletButton
                  style={
                    {
                      '--wui-color-primary': '#10b981',
                      '--wui-color-primary-hover': '#059669',
                      '--wui-color-primary-text': '#ffffff',
                    } as React.CSSProperties
                  }
                />
              </div>
              <pre className="code-block">{`<WalletButton
  style={{
    '--wui-color-primary': '#10b981',
    '--wui-color-primary-hover': '#059669',
    '--wui-color-primary-text': '#ffffff',
  } as React.CSSProperties}
/>`}</pre>
            </section>

            {/* Example 5: Direct CSS Override */}
            <section className="section">
              <h3 className="example-title">5. Direct CSS Override (Pill Shape)</h3>
              <p className="example-description">
                Override specific styles directly via CSS selectors.
              </p>
              <div className="example-demo pill-button">
                <WalletButton />
              </div>
              <pre className="code-block">{`/* CSS */
.pill-button [data-wallet-button] {
  border-radius: 9999px;
}

/* JSX */
<div className="pill-button">
  <WalletButton />
</div>`}</pre>
            </section>

            {/* Example 6: Amber/Gold Theme with Light/Dark variants */}
            <section className="section">
              <h3 className="example-title">6. Theme-Aware Customization</h3>
              <p className="example-description">
                Create different styles for light and dark modes. Try switching
                themes to see the difference.
              </p>
              <div className="example-demo amber-theme">
                <WalletButton size="sm" />
              </div>
              <pre className="code-block">{`/* CSS - Light mode (default) */
.amber-theme {
  --wui-color-primary: #f59e0b;
  --wui-color-primary-hover: #d97706;
  --wui-color-primary-text: #ffffff;
}

/* CSS - Dark mode (glassy effect) */
.dark .amber-theme {
  --wui-color-primary: rgba(245, 179, 71, 0.15);
  --wui-color-primary-hover: rgba(245, 179, 71, 0.25);
  --wui-color-primary-text: rgba(255, 255, 255, 0.9);
}

.dark .amber-theme [data-wallet-button] {
  border: 1px solid rgba(245, 179, 71, 0.3);
}`}</pre>
            </section>

            {/* Example 7: Fully Custom Trigger */}
            <section className="section">
              <h3 className="example-title">7. Fully Custom Trigger Button</h3>
              <p className="example-description">
                Use <code>ConnectWalletMenu</code> and{' '}
                <code>ConnectedWalletMenu</code> components directly with your
                own custom button for complete control.
              </p>
              <div className="example-demo">
                <CustomTriggerButton />
              </div>
              <pre className="code-block">{`/* CSS (see App.css for full styles) */
.custom-button {
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  background: transparent;
}
.custom-button-connected {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

/* JSX */
import {
  ConnectWalletMenu,
  ConnectedWalletMenu
} from '@txnlab/use-wallet-ui-react'

function CustomTriggerButton() {
  const { activeAddress } = useWallet()

  if (activeAddress) {
    return (
      <ConnectedWalletMenu>
        <button className="custom-button custom-button-connected">
          {formatShortAddress(activeAddress)}
        </button>
      </ConnectedWalletMenu>
    )
  }

  return (
    <ConnectWalletMenu>
      <button className="custom-button">
        Connect
      </button>
    </ConnectWalletMenu>
  )
}`}</pre>
            </section>

            {/* Summary */}
            <section className="section">
              <h3 className="example-title">Customization Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <h4>CSS Variables</h4>
                  <p>
                    Override <code>--wui-color-*</code> variables on a wrapper
                    element for theming.
                  </p>
                </div>
                <div className="summary-item">
                  <h4>Size Prop</h4>
                  <p>
                    Use <code>size="sm|md|lg"</code> for predefined size
                    variants.
                  </p>
                </div>
                <div className="summary-item">
                  <h4>Style Prop</h4>
                  <p>
                    Pass CSS variables via <code>style</code> prop for
                    instance-specific overrides.
                  </p>
                </div>
                <div className="summary-item">
                  <h4>Direct CSS</h4>
                  <p>
                    Target <code>[data-wallet-button]</code> for direct style
                    overrides.
                  </p>
                </div>
                <div className="summary-item">
                  <h4>Custom Trigger</h4>
                  <p>
                    Use Menu components with your own buttons for full control.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </WalletUIProvider>
    </WalletProvider>
  )
}

export default App
