import type { Meta, StoryObj } from '@storybook/react'
import { AddToWalletPanel } from '../components/AddToWalletPanel'
import type { AddToWalletPanelProps } from '../components/AddToWalletPanel'
import type { AssetHoldingDisplay } from '../components/ManagePanel'

const noop = () => {}

// Data URI for a simple wallet icon (orange hexagon)
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

const defaultProps: AddToWalletPanelProps = {
  walletName: 'MetaMask',
  walletIcon: WALLET_ICON,
  onAddNetwork: noop,
  onAddAsset: noop,
  onBack: noop,
}

const meta: Meta<typeof AddToWalletPanel> = {
  title: 'AddToWalletPanel',
  component: AddToWalletPanel,
  args: defaultProps,
}

export default meta
type Story = StoryObj<typeof AddToWalletPanel>

export const NetworkOnly: Story = {
  args: {},
}

export const WithAssets: Story = {
  args: {
    assets: sampleAssets,
  },
}

export const SingleAsset: Story = {
  args: {
    assets: [sampleAssets[0]],
  },
}

export const DifferentWallet: Story = {
  args: {
    walletName: 'Rabby',
  },
}
