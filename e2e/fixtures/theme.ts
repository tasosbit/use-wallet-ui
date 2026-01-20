import { test as base, expect, type Page } from '@playwright/test'

// Expected CSS variable values from WalletUIProvider.tsx
export const LIGHT_THEME_COLORS = {
  '--wui-color-primary': '#2d2df1',
  '--wui-color-primary-hover': '#2929d9',
  '--wui-color-primary-text': '#ffffff',
  '--wui-color-bg': '#ffffff',
  '--wui-color-bg-secondary': '#f9fafb',
  '--wui-color-bg-tertiary': '#f3f4f6',
  '--wui-color-bg-hover': '#e9e9fd',
  '--wui-color-text': '#1f2937',
  '--wui-color-text-secondary': '#6b7280',
  '--wui-color-text-tertiary': '#9ca3af',
  '--wui-color-border': '#e5e7eb',
  '--wui-color-link': 'rgba(45, 45, 241, 0.8)',
  '--wui-color-link-hover': '#2d2df1',
  '--wui-color-overlay': 'rgba(0, 0, 0, 0.3)',
  '--wui-color-danger-bg': '#fee2e2',
  '--wui-color-danger-bg-hover': '#fecaca',
  '--wui-color-danger-text': '#b91c1c',
  '--wui-color-avatar-bg': '#e5e7eb',
  '--wui-color-avatar-icon': '#9ca3af',
} as const

export const DARK_THEME_COLORS = {
  '--wui-color-primary': '#bfbff9',
  '--wui-color-primary-hover': '#d4d4fa',
  '--wui-color-primary-text': '#001324',
  '--wui-color-bg': '#001324',
  '--wui-color-bg-secondary': '#101b29',
  '--wui-color-bg-tertiary': '#192a39',
  '--wui-color-bg-hover': '#192a39',
  '--wui-color-text': '#e9e9fd',
  '--wui-color-text-secondary': '#99a1a7',
  '--wui-color-text-tertiary': '#6b7280',
  '--wui-color-border': '#192a39',
  '--wui-color-link': '#6c6cf1',
  '--wui-color-link-hover': '#8080f3',
  '--wui-color-overlay': 'rgba(0, 0, 0, 0.5)',
  '--wui-color-danger-bg': 'rgba(127, 29, 29, 0.4)',
  '--wui-color-danger-bg-hover': 'rgba(127, 29, 29, 0.6)',
  '--wui-color-danger-text': '#fca5a5',
  '--wui-color-avatar-bg': '#192a39',
  '--wui-color-avatar-icon': '#6b7280',
} as const

export type Theme = 'system' | 'light' | 'dark'

export interface ThemeTestFixtures {
  /** Select a theme from the dropdown */
  selectTheme: (theme: Theme) => Promise<void>
  /** Get a computed CSS variable value from the [data-wallet-theme] element */
  getComputedCSSVariable: (variable: string) => Promise<string>
  /** Wait for theme transition to complete */
  waitForThemeStable: () => Promise<void>
  /** Assert that light theme CSS variables are applied */
  assertLightTheme: () => Promise<void>
  /** Assert that dark theme CSS variables are applied */
  assertDarkTheme: () => Promise<void>
}

/**
 * Get a computed CSS variable value from the [data-wallet-theme] element
 */
async function getCSSVariable(page: Page, variable: string): Promise<string> {
  return page.evaluate((varName) => {
    const el = document.querySelector('[data-wallet-theme]')
    if (!el) throw new Error('Could not find [data-wallet-theme] element')
    return getComputedStyle(el).getPropertyValue(varName).trim()
  }, variable)
}

/**
 * Extended test with theme fixtures
 */
export const test = base.extend<ThemeTestFixtures>({
  selectTheme: async ({ page }, use) => {
    const selectTheme = async (theme: Theme) => {
      // Find the theme selector dropdown
      const selector = page.locator('select').filter({ hasText: /System/ })
      await selector.selectOption(theme)
      // Wait for React state update
      await page.waitForTimeout(100)
    }
    await use(selectTheme)
  },

  getComputedCSSVariable: async ({ page }, use) => {
    const getVar = async (variable: string): Promise<string> => {
      return getCSSVariable(page, variable)
    }
    await use(getVar)
  },

  waitForThemeStable: async ({ page }, use) => {
    const waitForStable = async () => {
      // Wait for any CSS transitions to complete
      await page
        .waitForFunction(
          () => {
            const elements = document.querySelectorAll('[data-wallet-theme] *')
            return Array.from(elements).every((el) => {
              const style = getComputedStyle(el)
              return (
                style.transitionDuration === '0s' ||
                style.animationDuration === '0s'
              )
            })
          },
          { timeout: 2000 },
        )
        .catch(() => {
          // Fallback timeout if transition detection fails
        })
      await page.waitForTimeout(150)
    }
    await use(waitForStable)
  },

  assertLightTheme: async ({ page }, use) => {
    const assertLight = async () => {
      const primary = await getCSSVariable(page, '--wui-color-primary')
      expect(primary).toBe(LIGHT_THEME_COLORS['--wui-color-primary'])

      const bg = await getCSSVariable(page, '--wui-color-bg')
      expect(bg).toBe(LIGHT_THEME_COLORS['--wui-color-bg'])

      const text = await getCSSVariable(page, '--wui-color-text')
      expect(text).toBe(LIGHT_THEME_COLORS['--wui-color-text'])
    }
    await use(assertLight)
  },

  assertDarkTheme: async ({ page }, use) => {
    const assertDark = async () => {
      const primary = await getCSSVariable(page, '--wui-color-primary')
      expect(primary).toBe(DARK_THEME_COLORS['--wui-color-primary'])

      const bg = await getCSSVariable(page, '--wui-color-bg')
      expect(bg).toBe(DARK_THEME_COLORS['--wui-color-bg'])

      const text = await getCSSVariable(page, '--wui-color-text')
      expect(text).toBe(DARK_THEME_COLORS['--wui-color-text'])
    }
    await use(assertDark)
  },
})

export { expect }
