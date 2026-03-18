import type { Meta, StoryObj } from '@storybook/react'
import { TransactionFlow } from '../components/TransactionFlow'
import * as mocks from './mocks'

const meta: Meta<typeof TransactionFlow> = {
  title: 'TransactionFlow',
  component: TransactionFlow,
}

export default meta
type Story = StoryObj<typeof TransactionFlow>

export const Payment: Story = {
  args: {
    txn: mocks.singlePayment()[0],
  },
}

export const AssetOptIn: Story = {
  args: {
    txn: mocks.assetOptIn()[0],
    assetInfo: { name: 'USDC', unitName: 'USDC', decimals: 6 },
  },
}

export const AssetTransfer: Story = {
  args: {
    txn: mocks.assetTransfer()[0],
    assetInfo: { name: 'USDC', unitName: 'USDC', decimals: 6 },
  },
}

export const ApplicationCall: Story = {
  args: {
    txn: mocks.applicationCall()[0],
  },
}

export const KeyRegistration: Story = {
  args: {
    txn: mocks.keyRegistration()[0],
  },
}

export const WithNote: Story = {
  args: {
    txn: mocks.singlePayment()[0],
  },
}

export const WithRekeyWarning: Story = {
  args: {
    txn: mocks.rekeyTransaction()[0],
  },
}

export const WithCloseWarning: Story = {
  args: {
    txn: mocks.closeOutTransaction()[0],
  },
}

export const WithExpandButton: Story = {
  args: {
    txn: mocks.singlePayment()[0],
    onExpand: () => console.log('expand'),
  },
}

export const WithAppEscrow: Story = {
  args: {
    txn: mocks.applicationCall()[0],
    appEscrows: {
      ALICE7WQKCD3YXFHQKJLSS6EZKQUDM73IQEJDLNKKFGCWHRN3EKJHMA4I: 'App Escrow',
    },
  },
}
