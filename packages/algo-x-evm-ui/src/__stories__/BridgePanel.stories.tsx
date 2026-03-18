import type { Meta, StoryObj } from '@storybook/react'
import { BridgePanel } from '../components/BridgePanel'
import type { BridgePanelProps, BridgeChainDisplay, BridgeTokenDisplay } from '../components/BridgePanel'

const EVM_ADDR = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'
const ALGO_ADDR = 'ALICE7WQKCD3YXFHQKJLSS6EZKQUDM73IQEJDLNKKFGCWHRN3EKJHMA4I'
const SOURCE_TX = '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd'
const DEST_TX = 'XYZABC123DEF456789ABC123DEF456789ABC123DEF456789AB'

const usdcToken = (chain: string, chainName: string, balance?: string): BridgeTokenDisplay => ({
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  chainSymbol: chain,
  chainName,
  balance,
})

const ethChain: BridgeChainDisplay = {
  chainSymbol: 'ETH',
  chainName: 'Ethereum',
  tokens: [usdcToken('ETH', 'Ethereum', '150000000')], // 150 USDC
}

const polyChain: BridgeChainDisplay = {
  chainSymbol: 'POL',
  chainName: 'Polygon',
  tokens: [usdcToken('POL', 'Polygon', '75500000')], // 75.5 USDC
}

const algChain: BridgeChainDisplay = {
  chainSymbol: 'ALG',
  chainName: 'Algorand',
  tokens: [usdcToken('ALG', 'Algorand', '200000000')], // 200 USDC
}

const noop = () => {}

const defaultProps: BridgePanelProps = {
  chains: [ethChain, polyChain],
  chainsLoading: false,
  sourceChainSymbol: 'ETH',
  onSourceChainChange: noop,
  sourceTokenSymbol: 'USDC',
  onSourceTokenChange: noop,
  destinationTokenSymbol: 'USDC',
  destinationTokens: [usdcToken('ALG', 'Algorand')],
  onDestinationTokenChange: noop,
  amount: '',
  onAmountChange: noop,
  receivedAmount: null,
  quoteLoading: false,
  gasFee: null,
  gasFeeLoading: false,
  gasFeeUnit: null,
  extraGasAlgo: null,
  evmAddress: EVM_ADDR,
  algorandAddress: ALGO_ADDR,
  estimatedTimeMs: null,
  waitingSince: null,
  transferStatus: null,
  optInNeeded: false,
  optInSigned: false,
  watchingForFunding: false,
  optInConfirmed: false,
  status: 'idle',
  error: null,
  sourceTxId: null,
  onBridge: noop,
  onReset: noop,
  onRetry: noop,
  onBack: noop,
}

const meta: Meta<typeof BridgePanel> = {
  title: 'BridgePanel',
  component: BridgePanel,
  args: defaultProps,
}

export default meta
type Story = StoryObj<typeof BridgePanel>

// -- Idle / Form States --

export const EmptyForm: Story = {
  args: {
    amount: '',
    receivedAmount: null,
  },
}

export const FormWithQuote: Story = {
  args: {
    amount: '50',
    receivedAmount: '49.12',
    gasFee: '0.88',
    gasFeeUnit: 'USDC',
    estimatedTimeMs: 180_000,
  },
}

export const FormWithExtraGas: Story = {
  args: {
    amount: '50',
    receivedAmount: '48.50',
    gasFee: '0.88',
    gasFeeUnit: 'USDC',
    extraGasAlgo: '~0.123 ALGO',
    estimatedTimeMs: 180_000,
  },
}

export const QuoteLoading: Story = {
  args: {
    amount: '50',
    quoteLoading: true,
  },
}

export const InsufficientBalance: Story = {
  args: {
    amount: '999',
    receivedAmount: '997.50',
    gasFee: '1.50',
    gasFeeUnit: 'USDC',
  },
}

export const AlgorandToEvm: Story = {
  args: {
    chains: [algChain],
    sourceChainSymbol: 'ALG',
    sourceIsAlgorand: true,
    destinationChains: [ethChain, polyChain],
    destinationChainSymbol: 'ETH',
    onDestinationChainChange: noop,
    amount: '100',
    receivedAmount: '98.75',
    gasFee: '1.25',
    gasFeeUnit: 'USDC',
    estimatedTimeMs: 300_000,
  },
}

// -- Loading / Empty States --

export const LoadingChains: Story = {
  args: {
    chains: [],
    chainsLoading: true,
    sourceChainSymbol: null,
    sourceTokenSymbol: null,
    destinationTokenSymbol: null,
    destinationTokens: [],
  },
}

export const NoChainsAvailable: Story = {
  args: {
    chains: [],
    chainsLoading: false,
    sourceChainSymbol: null,
    sourceTokenSymbol: null,
    destinationTokenSymbol: null,
    destinationTokens: [],
  },
}

// -- Signing States --

export const PermitSigning: Story = {
  args: {
    status: 'permit-signing',
    amount: '50',
  },
}

export const Approving: Story = {
  args: {
    status: 'approving',
    amount: '50',
  },
}

export const Bundling: Story = {
  args: {
    status: 'bundling',
    amount: '50',
  },
}

export const ConfirmInWallet: Story = {
  args: {
    status: 'signing',
    amount: '50',
  },
}

export const OptingIn: Story = {
  args: {
    status: 'opting-in',
    amount: '50',
  },
}

export const Sending: Story = {
  args: {
    status: 'sending',
    amount: '50',
  },
}

// -- Progress States --

export const WaitingEarlyConfirmations: Story = {
  args: {
    status: 'waiting',
    amount: '50',
    sourceTxId: SOURCE_TX,
    estimatedTimeMs: 180_000,
    waitingSince: Date.now() - 30_000,
    transferStatus: {
      sendConfirmations: 2,
      sendConfirmationsNeeded: 12,
      signaturesCount: 0,
      signaturesNeeded: 3,
      receiveConfirmations: null,
      receiveConfirmationsNeeded: null,
    },
  },
}

export const WaitingValidatorSignatures: Story = {
  args: {
    status: 'waiting',
    amount: '50',
    sourceTxId: SOURCE_TX,
    estimatedTimeMs: 180_000,
    waitingSince: Date.now() - 90_000,
    transferStatus: {
      sendConfirmations: 12,
      sendConfirmationsNeeded: 12,
      signaturesCount: 1,
      signaturesNeeded: 3,
      receiveConfirmations: null,
      receiveConfirmationsNeeded: null,
    },
  },
}

export const WaitingDestinationDelivery: Story = {
  args: {
    status: 'waiting',
    amount: '50',
    sourceTxId: SOURCE_TX,
    estimatedTimeMs: 180_000,
    waitingSince: Date.now() - 150_000,
    transferStatus: {
      sendConfirmations: 12,
      sendConfirmationsNeeded: 12,
      signaturesCount: 3,
      signaturesNeeded: 3,
      receiveConfirmations: 0,
      receiveConfirmationsNeeded: 1,
    },
  },
}

export const WaitingWithOptIn: Story = {
  args: {
    status: 'waiting',
    amount: '50',
    sourceTxId: SOURCE_TX,
    estimatedTimeMs: 180_000,
    waitingSince: Date.now() - 60_000,
    optInNeeded: true,
    optInSigned: false,
    watchingForFunding: false,
    optInConfirmed: false,
    transferStatus: {
      sendConfirmations: 5,
      sendConfirmationsNeeded: 12,
      signaturesCount: 0,
      signaturesNeeded: 3,
      receiveConfirmations: null,
      receiveConfirmationsNeeded: null,
    },
  },
}

export const WaitingOptInFunding: Story = {
  args: {
    status: 'watching-funding',
    amount: '50',
    sourceTxId: SOURCE_TX,
    estimatedTimeMs: 180_000,
    waitingSince: Date.now() - 90_000,
    optInNeeded: true,
    optInSigned: true,
    watchingForFunding: true,
    optInConfirmed: false,
    transferStatus: {
      sendConfirmations: 12,
      sendConfirmationsNeeded: 12,
      signaturesCount: 2,
      signaturesNeeded: 3,
      receiveConfirmations: null,
      receiveConfirmationsNeeded: null,
    },
  },
}

export const WaitingOptInConfirmed: Story = {
  args: {
    status: 'waiting',
    amount: '50',
    sourceTxId: SOURCE_TX,
    estimatedTimeMs: 180_000,
    waitingSince: Date.now() - 120_000,
    optInNeeded: true,
    optInSigned: true,
    watchingForFunding: false,
    optInConfirmed: true,
    transferStatus: {
      sendConfirmations: 12,
      sendConfirmationsNeeded: 12,
      signaturesCount: 3,
      signaturesNeeded: 3,
      receiveConfirmations: 0,
      receiveConfirmationsNeeded: 1,
    },
  },
}

// -- Terminal States --

export const SuccessEvmToAlgorand: Story = {
  args: {
    status: 'success',
    amount: '50',
    receivedAmount: '49.12',
    sourceChainSymbol: 'ETH',
    destinationTokenSymbol: 'USDC',
    destinationChainSymbol: 'ALG',
    sourceTxId: SOURCE_TX,
    destinationTxId: DEST_TX,
  },
}

export const SuccessAlgorandToEvm: Story = {
  args: {
    status: 'success',
    amount: '100',
    receivedAmount: '98.75',
    chains: [algChain],
    sourceChainSymbol: 'ALG',
    sourceIsAlgorand: true,
    destinationChainSymbol: 'ETH',
    destinationChains: [ethChain],
    destinationTokenSymbol: 'USDC',
    sourceTxId: DEST_TX,
    destinationTxId: SOURCE_TX,
  },
}

export const ErrorWithMessage: Story = {
  args: {
    status: 'error',
    error: 'Transaction reverted: insufficient allowance for bridge contract',
    sourceTxId: SOURCE_TX,
  },
}

export const ErrorWithoutTx: Story = {
  args: {
    status: 'error',
    error: 'User rejected the request',
    sourceTxId: null,
  },
}

// -- UI Options --

export const HiddenHeader: Story = {
  args: {
    hideHeader: true,
    amount: '50',
    receivedAmount: '49.12',
    gasFee: '0.88',
    gasFeeUnit: 'USDC',
  },
}
