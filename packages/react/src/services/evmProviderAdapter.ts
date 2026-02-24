/**
 * Wraps an EIP-1193 provider (MetaMask/Rainbow) into a Web3-compatible
 * object that the Allbridge SDK can consume for building raw transactions.
 */

export interface EIP1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

export function createWeb3Adapter(provider: EIP1193Provider) {
  return {
    eth: {
      getBalance: (address: string) =>
        provider.request({ method: 'eth_getBalance', params: [address, 'latest'] }),

      estimateGas: (tx: Record<string, unknown>) =>
        provider.request({ method: 'eth_estimateGas', params: [tx] }),

      sendTransaction: async (tx: Record<string, unknown>) => {
        const txHash = await provider.request({ method: 'eth_sendTransaction', params: [tx] })
        return { transactionHash: txHash }
      },

      Contract: class UnsupportedContract {
        constructor() {
          throw new Error('Contract interaction not supported through EIP-1193 adapter')
        }
      },

      BatchRequest: class UnsupportedBatch {
        constructor() {
          throw new Error('BatchRequest not supported through EIP-1193 adapter')
        }
      },
    },
  }
}
