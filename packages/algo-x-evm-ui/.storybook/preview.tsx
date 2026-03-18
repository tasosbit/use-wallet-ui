import type { Preview } from '@storybook/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './storybook.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
})

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Wallet UI theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light'
      return (
        <QueryClientProvider client={queryClient}>
          <div
            data-wallet-theme
            data-wallet-ui
            data-theme={theme}
            style={{
              maxWidth: 448,
              margin: '2rem auto',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,.15)',
              backgroundColor: 'var(--wui-color-bg)',
              color: 'var(--wui-color-text)',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            }}
          >
            <Story />
          </div>
        </QueryClientProvider>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
}

export default preview
