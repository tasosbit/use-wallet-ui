import type { Meta, StoryObj } from '@storybook/react'
import { ReceivePanel } from '../components/ReceivePanel'
import type { ReceivePanelProps } from '../components/ReceivePanel'
import type { CachedAsset } from '../cache/assetCache'

const ADDR_ALICE = 'ALICE7WQKCD3YXFHQKJLSS6EZKQUDM73IQEJDLNKKFGCWHRN3EKJHMA4I'
const EVM_ADDR = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'
const TX_ID = 'XYZABC123DEF456789ABC123DEF456789ABC123DEF456789AB'

const noop = () => {}

const optedInIds = new Set([31566704])

const searchResults: CachedAsset[] = [
  { index: 31566704, name: 'USDC', unitName: 'USDC', decimals: 6, peraVerified: true },
  { index: 312769, name: 'Tether USDt', unitName: 'USDt', decimals: 6, peraVerified: true },
  { index: 386192725, name: 'goETH', unitName: 'goETH', decimals: 8, peraVerified: false },
  { index: 226701642, name: 'Pact', unitName: 'PACT', decimals: 6, peraVerified: false },
]

const defaultProps: ReceivePanelProps = {
  activeAddress: ADDR_ALICE,
  optedInAssetIds: optedInIds,
  assetIdInput: '',
  setAssetIdInput: noop,
  assetInfo: null,
  assetLookupLoading: false,
  assetLookupError: null,
  status: 'idle',
  error: null,
  handleOptIn: noop,
  reset: noop,
  retry: noop,
  onBack: noop,
}

const meta: Meta<typeof ReceivePanel> = {
  title: 'ReceivePanel',
  component: ReceivePanel,
  args: defaultProps,
}

export default meta
type Story = StoryObj<typeof ReceivePanel>

// -- Idle States --

export const Idle: Story = {
  args: {},
}

export const WithEvmAddress: Story = {
  args: {
    evmAddress: EVM_ADDR,
  },
}

// -- ID Mode: Asset Lookup --

export const AssetFoundById: Story = {
  args: {
    assetIdInput: '386192725',
    assetInfo: { name: 'goETH', unitName: 'goETH', index: 386192725 },
  },
}

export const AssetAlreadyOptedIn: Story = {
  args: {
    assetIdInput: '31566704',
    assetInfo: { name: 'USDC', unitName: 'USDC', index: 31566704 },
    onOptOut: noop,
  },
}

export const AssetLookupLoading: Story = {
  args: {
    assetIdInput: '386192725',
    assetLookupLoading: true,
  },
}

export const AssetLookupError: Story = {
  args: {
    assetIdInput: '999999999',
    assetLookupError: 'Asset not found',
  },
}

// -- Name Search Mode --

export const NameSearchResults: Story = {
  args: {
    assetIdInput: 'usd',
    isNameMode: true,
    nameSearchResults: searchResults,
    nameSearchLoading: false,
    onSelectNameAsset: noop,
  },
}

export const NameSearchLoading: Story = {
  args: {
    assetIdInput: 'usd',
    isNameMode: true,
    nameSearchLoading: true,
    nameSearchResults: [],
  },
}

export const NameSearchNoResults: Story = {
  args: {
    assetIdInput: 'zzzznotfound',
    isNameMode: true,
    nameSearchResults: [],
    nameSearchLoading: false,
  },
}

export const NameSearchSelected: Story = {
  args: {
    assetIdInput: 'goETH',
    isNameMode: true,
    selectedNameAsset: { index: 386192725, name: 'goETH', unitName: 'goETH', decimals: 8, peraVerified: false },
    onSelectNameAsset: noop,
  },
}

export const NameSearchVerifiedAsset: Story = {
  args: {
    assetIdInput: 'USDC',
    isNameMode: true,
    selectedNameAsset: { index: 31566704, name: 'USDC', unitName: 'USDC', decimals: 6, peraVerified: true },
    onSelectNameAsset: noop,
  },
}

// -- Registry Loading --

export const RegistryLoading: Story = {
  args: {
    registryLoading: true,
  },
}

// -- Transaction States --

export const Signing: Story = {
  args: {
    status: 'signing',
  },
}

export const Sending: Story = {
  args: {
    status: 'sending',
  },
}

export const Success: Story = {
  args: {
    status: 'success',
    txId: TX_ID,
  },
}

export const SuccessWithExplorer: Story = {
  args: {
    status: 'success',
    txId: TX_ID,
    explorerUrl: `https://allo.info/tx/${TX_ID}`,
  },
}

export const Error: Story = {
  args: {
    status: 'error',
    error: 'Transaction rejected by user',
  },
}
