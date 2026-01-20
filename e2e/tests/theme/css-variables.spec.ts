import { test, expect, LIGHT_THEME_COLORS, DARK_THEME_COLORS } from '../../fixtures/theme'

// Tests for CSS variables that are critical for portal-rendered components
// These variables must be properly defined to avoid theming regressions
test.describe('Portal-Critical CSS Variables', () => {
  test.describe('Light Mode', () => {
    test.beforeEach(async ({ page, selectTheme, waitForThemeStable }) => {
      await page.goto('/')
      await page.waitForSelector('[data-wallet-theme]')
      await selectTheme('light')
      await waitForThemeStable()
    })

    test('danger colors are defined for disconnect button styling', async ({
      getComputedCSSVariable,
    }) => {
      const dangerBg = await getComputedCSSVariable('--wui-color-danger-bg')
      expect(dangerBg).toBe(LIGHT_THEME_COLORS['--wui-color-danger-bg'])

      const dangerBgHover = await getComputedCSSVariable('--wui-color-danger-bg-hover')
      expect(dangerBgHover).toBe(LIGHT_THEME_COLORS['--wui-color-danger-bg-hover'])

      const dangerText = await getComputedCSSVariable('--wui-color-danger-text')
      expect(dangerText).toBe(LIGHT_THEME_COLORS['--wui-color-danger-text'])
    })

    test('avatar colors are defined for fallback avatar styling', async ({
      getComputedCSSVariable,
    }) => {
      const avatarBg = await getComputedCSSVariable('--wui-color-avatar-bg')
      expect(avatarBg).toBe(LIGHT_THEME_COLORS['--wui-color-avatar-bg'])

      const avatarIcon = await getComputedCSSVariable('--wui-color-avatar-icon')
      expect(avatarIcon).toBe(LIGHT_THEME_COLORS['--wui-color-avatar-icon'])
    })

    test('portal-rendered modal has correct CSS variables', async ({ page }) => {
      // Open the connect wallet modal (rendered in FloatingPortal)
      await page.click('button:has-text("Connect Wallet")')
      await page.waitForSelector('[role="dialog"]')
      await page.waitForTimeout(300)

      // Get CSS variables from the portal-rendered element
      // The portal wraps content in a div with data-wallet-theme attribute
      const portalElement = page.locator('#wallet-dialog-portal [data-wallet-theme]')

      const bgColor = await portalElement.evaluate((el) => {
        return getComputedStyle(el).getPropertyValue('--wui-color-bg').trim()
      })
      expect(bgColor).toBe(LIGHT_THEME_COLORS['--wui-color-bg'])

      const dangerBg = await portalElement.evaluate((el) => {
        return getComputedStyle(el).getPropertyValue('--wui-color-danger-bg').trim()
      })
      expect(dangerBg).toBe(LIGHT_THEME_COLORS['--wui-color-danger-bg'])
    })
  })

  test.describe('Dark Mode', () => {
    test.beforeEach(async ({ page, selectTheme, waitForThemeStable }) => {
      await page.goto('/')
      await page.waitForSelector('[data-wallet-theme]')
      await selectTheme('dark')
      await waitForThemeStable()
    })

    test('danger colors are defined for disconnect button styling', async ({
      getComputedCSSVariable,
    }) => {
      const dangerBg = await getComputedCSSVariable('--wui-color-danger-bg')
      expect(dangerBg).toBe(DARK_THEME_COLORS['--wui-color-danger-bg'])

      const dangerBgHover = await getComputedCSSVariable('--wui-color-danger-bg-hover')
      expect(dangerBgHover).toBe(DARK_THEME_COLORS['--wui-color-danger-bg-hover'])

      const dangerText = await getComputedCSSVariable('--wui-color-danger-text')
      expect(dangerText).toBe(DARK_THEME_COLORS['--wui-color-danger-text'])
    })

    test('avatar colors are defined for fallback avatar styling', async ({
      getComputedCSSVariable,
    }) => {
      const avatarBg = await getComputedCSSVariable('--wui-color-avatar-bg')
      expect(avatarBg).toBe(DARK_THEME_COLORS['--wui-color-avatar-bg'])

      const avatarIcon = await getComputedCSSVariable('--wui-color-avatar-icon')
      expect(avatarIcon).toBe(DARK_THEME_COLORS['--wui-color-avatar-icon'])
    })

    test('portal-rendered modal has correct CSS variables', async ({ page }) => {
      // Open the connect wallet modal (rendered in FloatingPortal)
      await page.click('button:has-text("Connect Wallet")')
      await page.waitForSelector('[role="dialog"]')
      await page.waitForTimeout(300)

      // Get CSS variables from the portal-rendered element
      // The portal wraps content in a div with data-wallet-theme attribute
      const portalElement = page.locator('#wallet-dialog-portal [data-wallet-theme]')

      const bgColor = await portalElement.evaluate((el) => {
        return getComputedStyle(el).getPropertyValue('--wui-color-bg').trim()
      })
      expect(bgColor).toBe(DARK_THEME_COLORS['--wui-color-bg'])

      const dangerBg = await portalElement.evaluate((el) => {
        return getComputedStyle(el).getPropertyValue('--wui-color-danger-bg').trim()
      })
      expect(dangerBg).toBe(DARK_THEME_COLORS['--wui-color-danger-bg'])
    })
  })
})
