import { ALGORAND_CHAIN_ID_HEX } from 'liquid-accounts-evm'
import type { EIP1193Provider } from './evmProviderAdapter'

/**
 * Switch the EVM wallet to the correct chain for the bridge source.
 */
export async function switchToEvmChain(
  provider: EIP1193Provider,
  chainId: string, // hex string e.g. "0x1"
): Promise<void> {
  const currentChainId = (await provider.request({ method: 'eth_chainId' })) as string
  if (currentChainId.toLowerCase() === chainId.toLowerCase()) return

  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    })
  } catch (error: unknown) {
    const code = (error as { code?: number }).code
    if (code === 4902) {
      throw new Error(`Chain ${chainId} not found in wallet. Please add it manually.`)
    }
    throw error
  }
}

/**
 * Switch back to the Algorand EVM chain (4160 / 0x1040) after bridge.
 */
export async function switchBackToAlgorand(provider: EIP1193Provider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ALGORAND_CHAIN_ID_HEX }],
    })
  } catch {
    // Non-blocking — ensureAlgorandChain() in LiquidEvmBaseWallet will handle this
    // on the next Algorand signing operation
  }
}
