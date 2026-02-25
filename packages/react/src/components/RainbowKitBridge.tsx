import { useEffect, useRef } from 'react'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useAccount, useAccountEffect } from 'wagmi'
import { watchAccount, disconnect as wagmiDisconnect, getAccount } from '@wagmi/core'

const RAINBOWKIT_ID = 'rainbowkit'

// ---------------------------------------------------------------------------
// Structural types — avoid importing exact types from @wagmi/core and
// @txnlab/use-wallet-react so consumers don't hit version-mismatch errors
// when different copies of viem / use-wallet are resolved across the monorepo.
// ---------------------------------------------------------------------------

/** Minimal wallet interface used by the bridge. */
interface WalletLike {
  id: string
  isConnected: boolean
  connect: () => Promise<unknown>
  disconnect: () => Promise<void>
  resumeSession: () => Promise<void>
}

/** Minimal WalletManager interface used by the bridge. */
export interface WalletManagerLike {
  wallets: WalletLike[]
}

/**
 * Shared mutable state between the RainbowKitBridge component (which captures
 * the modal opener and watches modal close) and the getEvmAccounts callback.
 */
export interface RainbowKitBridgeState {
  openModal: (() => void) | null
  connectInProgress: boolean
  /** Called by the bridge component when the modal is dismissed without connecting. */
  cancelConnect: (() => void) | null
}

/** Create the shared state object. Call once at module level. */
export function createRainbowKitBridgeState(): RainbowKitBridgeState {
  return { openModal: null, connectInProgress: false, cancelConnect: null }
}

/**
 * Create a `getEvmAccounts` callback for RainbowKitWallet options.
 *
 * When called, it:
 * 1. Disconnects any existing wagmi session (to show fresh wallet selection)
 * 2. Opens the RainbowKit connect modal
 * 3. Watches wagmi state for a new connection
 * 4. Resolves with the connected EVM addresses
 *
 * If the user closes the modal without connecting, the bridge component
 * calls `state.cancelConnect()` which rejects the promise and clears the
 * in-progress flag so `connect()` can be called again.
 *
 * Must be used together with `<RainbowKitBridge />` in the component tree.
 */
export function createGetEvmAccounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wagmiConfig: any,
  state: RainbowKitBridgeState,
): () => Promise<string[]> {
  return () => {
    state.connectInProgress = true
    return new Promise<string[]>((resolve, reject) => {
      let settled = false

      const done = (result: string[]) => {
        if (settled) return
        settled = true
        state.connectInProgress = false
        state.cancelConnect = null
        resolve(result)
      }
      const fail = (err: Error) => {
        if (settled) return
        settled = true
        state.connectInProgress = false
        state.cancelConnect = null
        reject(err)
      }

      // Register cancellation handler — called by the bridge component
      // when the RainbowKit modal closes without a connection.
      state.cancelConnect = () => {
        fail(new Error('User dismissed the connect modal'))
      }

      let unwatchFn: (() => void) | null = null

      const startWatching = () => {
        unwatchFn = watchAccount(wagmiConfig, {
          onChange(account) {
            if (account.isConnected && account.address) {
              unwatchFn?.()
              unwatchFn = null
              // Delay briefly so RainbowKit can detect the connection and
              // close its modal before our connect() flow continues.
              setTimeout(() => {
                const addrs: string[] = account.addresses
                  ? [...account.addresses].filter((a): a is string => typeof a === 'string')
                  : [account.address]
                done(addrs)
              }, 200)
            }
          },
        })

        // Timeout after 2 minutes
        setTimeout(() => {
          unwatchFn?.()
          unwatchFn = null
          fail(new Error('Wallet connection timed out'))
        }, 120_000)
      }

      // Wait for the RainbowKit modal opener to become available.
      // RainbowKit only provides openConnectModal when disconnected,
      // so after wagmi disconnect we poll briefly for React to re-enable it.
      let attempts = 0
      const tryOpen = () => {
        if (state.openModal) {
          state.openModal()
          startWatching()
        } else if (attempts++ < 50) {
          setTimeout(tryOpen, 50)
        } else {
          fail(new Error('RainbowKit modal not ready'))
        }
      }

      // Disconnect existing session so modal shows wallet selection
      const currentAccount = getAccount(wagmiConfig)
      if (currentAccount.isConnected) {
        wagmiDisconnect(wagmiConfig).finally(tryOpen)
      } else {
        tryOpen()
      }
    })
  }
}

export interface RainbowKitBridgeProps {
  walletManager: WalletManagerLike
  state: RainbowKitBridgeState
}

/**
 * Bridge component that syncs RainbowKit/wagmi wallet state with use-wallet.
 *
 * - Captures RainbowKit's `openConnectModal` into the shared state so the
 *   `getEvmAccounts` callback can trigger it from outside React.
 * - Watches `connectModalOpen` to detect when the user dismisses the modal
 *   without connecting, and cancels the pending connect promise.
 * - Auto-connects the use-wallet RainbowKit wallet when wagmi connects.
 * - Auto-disconnects when wagmi disconnects.
 * - On mount, resumes session if wagmi is already connected.
 *
 * Place inside `<RainbowKitProvider>`.
 */
export function RainbowKitBridge({ walletManager, state }: RainbowKitBridgeProps) {
  // Capture RainbowKit's openConnectModal and connectModalOpen
  const { openConnectModal, connectModalOpen } = useConnectModal()
  useEffect(() => {
    state.openModal = openConnectModal ?? null
    return () => {
      state.openModal = null
    }
  }, [openConnectModal, state])

  // Track previous modal state to detect close transitions
  const prevModalOpenRef = useRef(false)
  useEffect(() => {
    const wasOpen = prevModalOpenRef.current
    prevModalOpenRef.current = !!connectModalOpen

    // Modal just closed (true → false) while a connect is in progress
    // and no wallet connected = user dismissed without connecting
    if (wasOpen && !connectModalOpen && state.connectInProgress) {
      // Small delay to allow any in-flight connection to settle
      setTimeout(() => {
        if (state.connectInProgress && state.cancelConnect) {
          state.cancelConnect()
        }
      }, 300)
    }
  }, [connectModalOpen, state])

  // Sync wagmi account changes with use-wallet
  const account = useAccount()
  const connectingRef = useRef(false)

  useAccountEffect({
    onConnect({ address }) {
      // Ignore events during getEvmAccounts flow — the SDK handles the connect
      if (state.connectInProgress || connectingRef.current) return
      const rkWallet = walletManager.wallets.find((w) => w.id === RAINBOWKIT_ID)
      if (rkWallet && !rkWallet.isConnected && address) {
        connectingRef.current = true
        rkWallet
          .connect()
          .catch((err: Error) => {
            console.warn('[RainbowKitBridge] auto-connect failed:', err.message)
          })
          .finally(() => {
            connectingRef.current = false
          })
      }
    },
    onDisconnect() {
      // Ignore wagmi disconnect events during the connect flow (getEvmAccounts
      // disconnects the old session before showing the wallet selection modal)
      if (state.connectInProgress || connectingRef.current) return
      const rkWallet = walletManager.wallets.find((w) => w.id === RAINBOWKIT_ID)
      if (rkWallet && rkWallet.isConnected) {
        rkWallet.disconnect().catch((err: Error) => {
          console.warn('[RainbowKitBridge] auto-disconnect failed:', err.message)
        })
      }
    },
  })

  // On mount / when wagmi state changes, sync with use-wallet
  useEffect(() => {
    if (account.isConnected && account.address) {
      const rkWallet = walletManager.wallets.find((w) => w.id === RAINBOWKIT_ID)
      if (rkWallet && !connectingRef.current) {
        if (!rkWallet.isConnected) {
          // Wallet not connected in store — do a full connect
          connectingRef.current = true
          rkWallet
            .connect()
            .catch((err: Error) => {
              console.warn('[RainbowKitBridge] mount auto-connect failed:', err.message)
            })
            .finally(() => {
              connectingRef.current = false
            })
        } else {
          // Wallet connected in store but instance may need session resumed
          // (e.g., after WalletManager recreation on network switch)
          rkWallet.resumeSession().catch(() => {})
        }
      }
    }
  }, [account.isConnected, account.address, walletManager])

  return null
}
