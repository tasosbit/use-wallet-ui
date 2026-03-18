import type { Meta, StoryObj } from '@storybook/react'
import { WelcomeContent } from '../components/WelcomeContent'
import type { WelcomeContentProps } from '../components/WelcomeContent'

const ALGO_ADDR = 'ALICE7WQKCD3YXFHQKJLSS6EZKQUDM73IQEJDLNKKFGCWHRN3EKJHMA4I'
const EVM_ADDR = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'

const noop = () => {}

const defaultProps: WelcomeContentProps = {
  algorandAddress: ALGO_ADDR,
  evmAddress: EVM_ADDR,
  onClose: noop,
}

const meta: Meta<typeof WelcomeContent> = {
  title: 'WelcomeContent',
  component: WelcomeContent,
  args: defaultProps,
}

export default meta
type Story = StoryObj<typeof WelcomeContent>

export const Default: Story = {
  args: {},
}

export const WithBridge: Story = {
  args: {
    bridgeAvailable: true,
    onBridgeClick: noop,
  },
}

export const WithAccessibilityIds: Story = {
  args: {
    labelId: 'welcome-label',
    descriptionId: 'welcome-desc',
    bridgeAvailable: true,
    onBridgeClick: noop,
  },
}
