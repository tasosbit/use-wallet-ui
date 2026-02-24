/**
 * Thin service wrapper around the Allbridge Core SDK.
 * Lazy-loads the SDK via dynamic import() to keep it out of the bundle
 * for consumers who don't use the bridge feature.
 */

// Re-export types that consumers will need — these are type-only so they're erased at runtime
export type {
  AllbridgeCoreSdk,
  ChainDetailsWithTokens,
  TokenWithChainDetails,
  GasFeeOptions,
  TransferStatusResponse,
} from '@allbridge/bridge-core-sdk'

export type NodeRpcUrls = Record<string, string>

const DEFAULT_RPC_URLS: NodeRpcUrls = {
  ETH: 'https://eth.drpc.org',
  BSC: 'https://bsc.drpc.org',
  POL: 'https://polygon.drpc.org',
  ARB: 'https://arbitrum.drpc.org',
  OPT: 'https://optimism.drpc.org',
  AVA: 'https://avalanche.drpc.org',
  BAS: 'https://base.drpc.org',
  CEL: 'https://celo.drpc.org',
  SNC: 'https://sonic.drpc.org',
  UNI: 'https://unichain.drpc.org',
  LIN: 'https://linea.drpc.org',
}

let sdkInstance: import('@allbridge/bridge-core-sdk').AllbridgeCoreSdk | null = null

export async function getOrCreateSdk(
  nodeRpcUrls?: NodeRpcUrls,
): Promise<import('@allbridge/bridge-core-sdk').AllbridgeCoreSdk> {
  if (sdkInstance) return sdkInstance
  const { AllbridgeCoreSdk, nodeRpcUrlsDefault } = await import('@allbridge/bridge-core-sdk')
  sdkInstance = new AllbridgeCoreSdk({ ...nodeRpcUrlsDefault, ...DEFAULT_RPC_URLS, ...nodeRpcUrls })
  return sdkInstance
}

export function resetSdk(): void {
  sdkInstance = null
}

export async function fetchChainDetailsMap(
  sdk: import('@allbridge/bridge-core-sdk').AllbridgeCoreSdk,
): Promise<import('@allbridge/bridge-core-sdk').ChainDetailsWithTokens[]> {
  const map = await sdk.chainDetailsMap()
  return Object.values(map)
}

export async function getQuote(
  sdk: import('@allbridge/bridge-core-sdk').AllbridgeCoreSdk,
  amount: string,
  sourceToken: import('@allbridge/bridge-core-sdk').TokenWithChainDetails,
  destinationToken: import('@allbridge/bridge-core-sdk').TokenWithChainDetails,
  messenger: number,
): Promise<string> {
  return sdk.getAmountToBeReceived(amount, sourceToken, destinationToken, messenger)
}

export async function getGasFees(
  sdk: import('@allbridge/bridge-core-sdk').AllbridgeCoreSdk,
  sourceToken: import('@allbridge/bridge-core-sdk').TokenWithChainDetails,
  destinationToken: import('@allbridge/bridge-core-sdk').TokenWithChainDetails,
  messenger: number,
): Promise<import('@allbridge/bridge-core-sdk').GasFeeOptions> {
  return sdk.getGasFeeOptions(sourceToken, destinationToken, messenger)
}

export function getEstimatedTime(
  sdk: import('@allbridge/bridge-core-sdk').AllbridgeCoreSdk,
  sourceToken: import('@allbridge/bridge-core-sdk').TokenWithChainDetails,
  destinationToken: import('@allbridge/bridge-core-sdk').TokenWithChainDetails,
  messenger: number,
): number | null {
  return sdk.getAverageTransferTime(sourceToken, destinationToken, messenger)
}

export async function getTransferStatus(
  sdk: import('@allbridge/bridge-core-sdk').AllbridgeCoreSdk,
  chainSymbol: string,
  txId: string,
): Promise<import('@allbridge/bridge-core-sdk').TransferStatusResponse> {
  return sdk.getTransferStatus(chainSymbol, txId)
}
