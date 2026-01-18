import { test, expect, DARK_THEME_COLORS } from '../../fixtures/theme'

test.describe('Dark Mode Theme', () => {
  test.beforeEach(async ({ page, selectTheme, waitForThemeStable }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-ui]')
    await selectTheme('dark')
    await waitForThemeStable()
  })

  test('should apply dark theme CSS variables', async ({
    assertDarkTheme,
    getComputedCSSVariable,
  }) => {
    await assertDarkTheme()

    // Verify additional critical CSS variables
    const primaryHover = await getComputedCSSVariable('--wui-color-primary-hover')
    expect(primaryHover).toBe(DARK_THEME_COLORS['--wui-color-primary-hover'])

    const bgSecondary = await getComputedCSSVariable('--wui-color-bg-secondary')
    expect(bgSecondary).toBe(DARK_THEME_COLORS['--wui-color-bg-secondary'])

    const border = await getComputedCSSVariable('--wui-color-border')
    expect(border).toBe(DARK_THEME_COLORS['--wui-color-border'])
  })

  test('should set data-theme attribute to dark', async ({ page }) => {
    const dataTheme = await page
      .locator('[data-wallet-ui]')
      .getAttribute('data-theme')
    expect(dataTheme).toBe('dark')
  })

  test('ConnectWalletButton has correct background color', async ({ page }) => {
    const button = page.locator('button:has-text("Connect Wallet")')
    await expect(button).toBeVisible()

    const bgColor = await button.evaluate((el) => {
      return getComputedStyle(el).backgroundColor
    })

    // #bfbff9 = rgb(191, 191, 249)
    expect(bgColor).toBe('rgb(191, 191, 249)')
  })

  test('modal uses dark theme colors', async ({ page }) => {
    // Click connect button to open modal
    await page.click('button:has-text("Connect Wallet")')

    // Wait for modal animation
    await page.waitForSelector('[role="dialog"]')

    // Verify modal background color
    const modalBg = await page.locator('[role="dialog"]').evaluate((el) => {
      return getComputedStyle(el).backgroundColor
    })

    // #001324 = rgb(0, 19, 36)
    expect(modalBg).toBe('rgb(0, 19, 36)')
  })
})
