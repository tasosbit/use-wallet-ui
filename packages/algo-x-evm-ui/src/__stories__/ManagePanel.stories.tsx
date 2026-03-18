import type { Meta, StoryObj } from '@storybook/react'
import { ManagePanel } from '../components/ManagePanel'
import type { ManagePanelProps } from '../components/ManagePanel'
import type { AssetHoldingDisplay } from '../components/ManagePanel'

const noop = () => {}

const WALLET_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23f97316"><path d="M12 2l9 5v10l-9 5-9-5V7z"/></svg>',
  )

const sampleAssets: AssetHoldingDisplay[] = [
  { assetId: 31566704, name: 'USDC', unitName: 'USDC', amount: '150.00', decimals: 6 },
  { assetId: 386192725, name: 'goETH', unitName: 'goETH', amount: '0.5', decimals: 8 },
  { assetId: 312769, name: 'Tether USDt', unitName: 'USDt', amount: '25.00', decimals: 6 },
]

const manyAssets: AssetHoldingDisplay[] = [
  ...sampleAssets,
  { assetId: 226701642, name: 'Pact', unitName: 'PACT', amount: '1000', decimals: 6 },
  { assetId: 287867876, name: 'Opulous', unitName: 'OPUL', amount: '500', decimals: 10 },
]

/** Minimal send props so the Send button is enabled and asset send arrows appear */
const minimalSend = {
  sendType: 'algo' as const,
  setSendType: noop,
  receiver: '',
  setReceiver: noop,
  amount: '',
  setAmount: noop,
  assetIdInput: '',
  setAssetIdInput: noop,
  assetInfo: null,
  assetLookupLoading: false,
  assetLookupError: null,
  status: 'idle' as const,
  error: null,
  handleSend: noop,
  reset: noop,
  retry: noop,
}

/** Minimal optIn props so the Receive button is enabled */
const minimalOptIn = {
  assetIdInput: '',
  setAssetIdInput: noop,
  assetInfo: null,
  assetLookupLoading: false,
  assetLookupError: null,
  status: 'idle' as const,
  error: null,
  handleOptIn: noop,
  reset: noop,
  retry: noop,
}

const defaultProps: ManagePanelProps = {
  displayBalance: 10.3,
  showAvailableBalance: true,
  onToggleBalance: noop,
  onBack: noop,
  onRefresh: noop,
  isRefreshing: false,
  onExplore: noop,
}

const meta: Meta<typeof ManagePanel> = {
  title: 'ManagePanel',
  component: ManagePanel,
  args: defaultProps,
}

export default meta
type Story = StoryObj<typeof ManagePanel>

// -- Main View --

export const Default: Story = {
  args: {},
}

export const TotalBalance: Story = {
  args: {
    displayBalance: 10.5,
    showAvailableBalance: false,
  },
}

export const NullBalance: Story = {
  args: {
    displayBalance: null,
  },
}

export const Refreshing: Story = {
  args: {
    isRefreshing: true,
  },
}

export const WithAssets: Story = {
  args: {
    assets: sampleAssets,
    send: minimalSend,
  },
}

export const ManyAssets: Story = {
  args: {
    assets: manyAssets,
    send: minimalSend,
  },
}

// -- Button States --

export const AllActionsEnabled: Story = {
  args: {
    assets: sampleAssets,
    send: minimalSend,
    optIn: minimalOptIn,
    onBridgeClick: noop,
  },
}

export const NoActionsAvailable: Story = {
  args: {
    onRefresh: undefined,
    onExplore: undefined,
  },
}

export const WithAddToWallet: Story = {
  args: {
    assets: sampleAssets,
    send: minimalSend,
    optIn: minimalOptIn,
    onBridgeClick: noop,
    addToWallet: {
      walletName: 'MetaMask',
      walletIcon: WALLET_ICON,
      assets: sampleAssets,
      onAddNetwork: noop,
      onAddAsset: noop,
    },
  },
}

export const ExternalBridgeClick: Story = {
  name: 'Bridge (external handler)',
  args: {
    send: minimalSend,
    optIn: minimalOptIn,
    onBridgeClick: noop,
  },
}
