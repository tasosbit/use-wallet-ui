import type { Meta, StoryObj } from '@storybook/react'
import { TransactionStatus } from '../components/TransactionStatus'

const TX_ID = 'XYZABC123DEF456789ABC123DEF456789ABC123DEF456789AB'

const meta: Meta<typeof TransactionStatus> = {
  title: 'TransactionStatus',
  component: TransactionStatus,
  args: {
    error: null,
    successMessage: 'Transaction sent successfully',
    onRetry: () => console.log('retry'),
  },
}

export default meta
type Story = StoryObj<typeof TransactionStatus>

export const Idle: Story = {
  args: {
    status: 'idle',
  },
}

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
  },
}

export const SuccessWithTxId: Story = {
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
