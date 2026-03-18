import type { Meta, StoryObj } from '@storybook/react'
import { SendPanel } from '../components/SendPanel'
import type { SendPanelProps } from '../components/SendPanel'
import type { AssetHoldingDisplay } from '../components/ManagePanel'

const ADDR_ALICE = 'ALICE7WQKCD3YXFHQKJLSS6EZKQUDM73IQEJDLNKKFGCWHRN3EKJHMA4I'
const ADDR_BOB = 'BOB3XHDYE5JGCFVTQFHDM3SRLHYQ67ZVZK4HDJND5KVMZQE2GKNHKVTBM'
const TX_ID = 'XYZABC123DEF456789ABC123DEF456789ABC123DEF456789AB'

const noop = () => {}

const sampleAssets: AssetHoldingDisplay[] = [
  { assetId: 31566704, name: 'USDC', unitName: 'USDC', amount: '150.00', decimals: 6 },
  { assetId: 386192725, name: 'goETH', unitName: 'goETH', amount: '0.5', decimals: 8 },
  { assetId: 312769, name: 'Tether USDt', unitName: 'USDt', amount: '0', decimals: 6 },
]

const defaultProps: SendPanelProps = {
  activeAddress: ADDR_ALICE,
  sendType: 'algo',
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
  totalBalance: 10.5,
  availableBalance: 10.3,
  status: 'idle',
  error: null,
  handleSend: noop,
  reset: noop,
  retry: noop,
  onBack: noop,
}

const meta: Meta<typeof SendPanel> = {
  title: 'SendPanel',
  component: SendPanel,
  args: defaultProps,
}

export default meta
type Story = StoryObj<typeof SendPanel>

// -- Idle / Form States --

export const IdleAlgo: Story = {
  args: {},
}

export const IdleAsaSelected: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '31566704',
    assetInfo: { name: 'USDC', unitName: 'USDC', index: 31566704 },
    accountAssets: sampleAssets,
  },
}

export const WithAccountAssets: Story = {
  args: {
    accountAssets: sampleAssets,
  },
}

export const WithAmount: Story = {
  args: {
    amount: '5.25',
    receiver: ADDR_BOB,
  },
}

// -- Asset Lookup --

export const AssetLookupLoading: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '31566704',
    assetLookupLoading: true,
  },
}

export const AssetLookupError: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '999999999',
    assetLookupError: 'Asset not found',
  },
}

// -- Receiver Validation --

export const InvalidReceiverAddress: Story = {
  args: {
    amount: '1',
    receiver: 'not-a-valid-address',
    receiverAddressError: 'Invalid Algorand address',
  },
}

export const ReceiverNotOptedIn: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '31566704',
    assetInfo: { name: 'USDC', unitName: 'USDC', index: 31566704 },
    amount: '10',
    receiver: ADDR_BOB,
    receiverOptInStatus: 'not-opted-in',
    accountAssets: sampleAssets,
  },
}

export const ReceiverOptInChecking: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '31566704',
    assetInfo: { name: 'USDC', unitName: 'USDC', index: 31566704 },
    amount: '10',
    receiver: ADDR_BOB,
    receiverOptInStatus: 'checking',
    accountAssets: sampleAssets,
  },
}

// -- Balance / Overspend --

export const Overspend: Story = {
  args: {
    amount: '999',
    receiver: ADDR_BOB,
  },
}

export const AvailableBalanceLabel: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '31566704',
    assetInfo: { name: 'USDC', unitName: 'USDC', index: 31566704 },
    accountAssets: sampleAssets,
  },
}

// -- Opt-out --

export const FullAsaOptOut: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '31566704',
    assetInfo: { name: 'USDC', unitName: 'USDC', index: 31566704 },
    amount: '150.00',
    receiver: ADDR_BOB,
    receiverOptInStatus: 'opted-in',
    accountAssets: sampleAssets,
    optOut: false,
    setOptOut: noop,
  },
}

export const FullAsaOptOutChecked: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '31566704',
    assetInfo: { name: 'USDC', unitName: 'USDC', index: 31566704 },
    amount: '150.00',
    receiver: ADDR_BOB,
    receiverOptInStatus: 'opted-in',
    accountAssets: sampleAssets,
    optOut: true,
    setOptOut: noop,
  },
}

export const ZeroBalanceOptOut: Story = {
  args: {
    sendType: 'asa',
    assetIdInput: '312769',
    assetInfo: { name: 'Tether USDt', unitName: 'USDt', index: 312769 },
    amount: '0',
    receiver: ADDR_ALICE,
    accountAssets: sampleAssets,
    optOut: true,
    setOptOut: noop,
  },
}

// -- Transaction States --

export const Signing: Story = {
  args: {
    status: 'signing',
    amount: '5',
    receiver: ADDR_BOB,
  },
}

export const Sending: Story = {
  args: {
    status: 'sending',
    amount: '5',
    receiver: ADDR_BOB,
  },
}

export const Success: Story = {
  args: {
    status: 'success',
    amount: '5',
    receiver: ADDR_BOB,
    txId: TX_ID,
  },
}

export const SuccessWithExplorer: Story = {
  args: {
    status: 'success',
    amount: '5',
    receiver: ADDR_BOB,
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

export const ErrorOverspend: Story = {
  args: {
    status: 'error',
    error: 'overspend (account balance 10300000 < 999000000)',
  },
}
