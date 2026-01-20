import { test, expect } from '../../fixtures/theme'

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-theme]')
  })

  test('should switch from light to dark', async ({
    selectTheme,
    assertLightTheme,
    assertDarkTheme,
    waitForThemeStable,
  }) => {
    await selectTheme('light')
    await assertLightTheme()

    await selectTheme('dark')
    await waitForThemeStable()
    await assertDarkTheme()
  })

  test('should switch from dark to light', async ({
    selectTheme,
    assertLightTheme,
    assertDarkTheme,
    waitForThemeStable,
  }) => {
    await selectTheme('dark')
    await assertDarkTheme()

    await selectTheme('light')
    await waitForThemeStable()
    await assertLightTheme()
  })

  test('should switch from explicit to system', async ({
    page,
    selectTheme,
    assertDarkTheme,
  }) => {
    // Set system to dark
    await page.emulateMedia({ colorScheme: 'dark' })

    // Start with explicit light
    await selectTheme('light')

    // Switch to system (which is dark)
    await selectTheme('system')
    await assertDarkTheme()
  })

  test('modal inherits correct theme after switch', async ({
    page,
    selectTheme,
  }) => {
    // Switch to dark
    await selectTheme('dark')

    // Open modal
    await page.click('button:has-text("Connect Wallet")')
    await page.waitForSelector('[role="dialog"]')

    // Verify the modal has the dark background
    const modalBg = await page.locator('[role="dialog"]').evaluate((el) => {
      return getComputedStyle(el).backgroundColor
    })

    // #001324 = rgb(0, 19, 36)
    expect(modalBg).toBe('rgb(0, 19, 36)')
  })

  test('rapid theme switching does not break UI', async ({
    page,
    selectTheme,
  }) => {
    // Rapidly switch themes
    for (let i = 0; i < 5; i++) {
      await selectTheme('light')
      await selectTheme('dark')
      await selectTheme('system')
    }

    // UI should still be responsive
    const button = page.locator('button:has-text("Connect Wallet")')
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
  })
})
