import type { Meta, StoryObj } from '@storybook/react'
import { TransactionReview } from '../components/TransactionReview'
import * as mocks from './mocks'

const TESTNET_GENESIS_HASH = 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI='

const meta: Meta<typeof TransactionReview> = {
  title: 'TransactionReview',
  component: TransactionReview,
  args: {
    message: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQ=',
    dangerous: false,
    onApprove: () => console.log('approved'),
    onReject: () => console.log('rejected'),
  },
}

export default meta
type Story = StoryObj<typeof TransactionReview>

export const SinglePayment: Story = {
  args: {
    transactions: mocks.singlePayment(),
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const GroupOfTwoPayments: Story = {
  args: {
    transactions: mocks.groupOfTwoPayments(),
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const RekeyTransaction: Story = {
  args: {
    transactions: mocks.rekeyTransaction(),
    dangerous: 'rekey',
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const CloseOutTransaction: Story = {
  args: {
    transactions: mocks.closeOutTransaction(),
    dangerous: 'closeTo',
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const AssetOptIn: Story = {
  args: {
    transactions: mocks.assetOptIn(),
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const AssetTransfer: Story = {
  args: {
    transactions: mocks.assetTransfer(),
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const ApplicationCall: Story = {
  args: {
    transactions: mocks.applicationCall(),
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const KeyRegistration: Story = {
  args: {
    transactions: mocks.keyRegistration(),
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const MixedGroup: Story = {
  args: {
    transactions: mocks.mixedGroup(),
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const Signing: Story = {
  args: {
    transactions: mocks.singlePayment(),
    signing: true,
    walletName: 'Pera Wallet',
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const WithOrigin: Story = {
  args: {
    transactions: mocks.singlePayment(),
    origin: 'https://dapp.example.com',
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const PayloadVerificationFailed: Story = {
  args: {
    transactions: mocks.singlePayment(),
    payloadVerified: false,
    genesisHash: TESTNET_GENESIS_HASH,
  },
}

export const UnknownNetwork: Story = {
  args: {
    transactions: mocks.singlePayment(),
    genesisHash: 'dW5rbm93bmdlbmVzaXNoYXNoYmFzZTY0ZW5jb2RlZA==',
  },
}
