import { test, expect, LIGHT_THEME_COLORS } from '../../fixtures/theme'

test.describe('Light Mode Theme', () => {
  test.beforeEach(async ({ page, selectTheme, waitForThemeStable }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-theme]')
    await selectTheme('light')
    await waitForThemeStable()
  })

  test('should apply light theme CSS variables', async ({
    assertLightTheme,
    getComputedCSSVariable,
  }) => {
    await assertLightTheme()

    // Verify additional critical CSS variables
    const primaryHover = await getComputedCSSVariable('--wui-color-primary-hover')
    expect(primaryHover).toBe(LIGHT_THEME_COLORS['--wui-color-primary-hover'])

    const bgSecondary = await getComputedCSSVariable('--wui-color-bg-secondary')
    expect(bgSecondary).toBe(LIGHT_THEME_COLORS['--wui-color-bg-secondary'])

    const border = await getComputedCSSVariable('--wui-color-border')
    expect(border).toBe(LIGHT_THEME_COLORS['--wui-color-border'])
  })

  test('should set data-theme attribute to light', async ({ page }) => {
    const dataTheme = await page
      .locator('[data-wallet-theme]')
      .getAttribute('data-theme')
    expect(dataTheme).toBe('light')
  })

  test('ConnectWalletButton has correct background color', async ({ page }) => {
    const button = page.locator('button:has-text("Connect Wallet")')
    await expect(button).toBeVisible()

    const bgColor = await button.evaluate((el) => {
      return getComputedStyle(el).backgroundColor
    })

    // #2d2df1 = rgb(45, 45, 241)
    expect(bgColor).toBe('rgb(45, 45, 241)')
  })

  test('should maintain light theme when system prefers dark', async ({
    page,
    selectTheme,
    assertLightTheme,
  }) => {
    // Emulate dark mode system preference
    await page.emulateMedia({ colorScheme: 'dark' })

    // Explicitly select light theme
    await selectTheme('light')

    // Should still be light
    await assertLightTheme()
  })
})
