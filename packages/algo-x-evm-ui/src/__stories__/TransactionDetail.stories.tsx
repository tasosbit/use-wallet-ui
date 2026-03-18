import type { Meta, StoryObj } from '@storybook/react'
import { TransactionDetail } from '../components/TransactionDetail'
import * as mocks from './mocks'

const noop = () => {}

const meta: Meta<typeof TransactionDetail> = {
  title: 'TransactionDetail',
  component: TransactionDetail,
  args: {
    onBack: noop,
    onPrev: noop,
    onNext: noop,
  },
}

export default meta
type Story = StoryObj<typeof TransactionDetail>

export const Payment: Story = {
  args: {
    txn: mocks.singlePayment()[0],
    position: 1,
    groupSize: 1,
  },
}

export const PaymentInGroup: Story = {
  args: {
    txn: mocks.groupOfTwoPayments()[1],
    position: 2,
    groupSize: 3,
  },
}

export const FirstInGroup: Story = {
  args: {
    txn: mocks.mixedGroup()[0],
    position: 1,
    groupSize: 3,
  },
}

export const LastInGroup: Story = {
  args: {
    txn: mocks.mixedGroup()[2],
    position: 3,
    groupSize: 3,
  },
}

export const RekeyDanger: Story = {
  args: {
    txn: mocks.rekeyTransaction()[0],
    position: 1,
    groupSize: 1,
  },
}

export const CloseOutDanger: Story = {
  args: {
    txn: mocks.closeOutTransaction()[0],
    position: 1,
    groupSize: 1,
  },
}

export const AssetTransfer: Story = {
  args: {
    txn: mocks.assetTransfer()[0],
    assetInfo: { name: 'USDC', unitName: 'USDC', decimals: 6 },
    position: 1,
    groupSize: 1,
  },
}

export const ApplicationCall: Story = {
  args: {
    txn: mocks.applicationCall()[0],
    position: 1,
    groupSize: 1,
  },
}
