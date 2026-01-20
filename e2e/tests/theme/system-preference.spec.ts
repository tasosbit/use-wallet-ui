import { test, expect } from '../../fixtures/theme'

test.describe('System Theme Preference', () => {
  test('should follow light system preference', async ({
    page,
    selectTheme,
    assertLightTheme,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await page.waitForSelector('[data-wallet-theme]')
    await selectTheme('system')

    await assertLightTheme()
  })

  test('should follow dark system preference', async ({
    page,
    selectTheme,
    assertDarkTheme,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.waitForSelector('[data-wallet-theme]')
    await selectTheme('system')

    await assertDarkTheme()
  })

  test('should not set data-theme attribute when using system', async ({
    page,
    selectTheme,
  }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-theme]')
    await selectTheme('system')

    const dataTheme = await page
      .locator('[data-wallet-theme]')
      .getAttribute('data-theme')
    expect(dataTheme).toBeNull()
  })

  test('should react to system preference changes', async ({
    page,
    selectTheme,
    assertLightTheme,
    assertDarkTheme,
  }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-theme]')
    await selectTheme('system')

    // Start with light
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForTimeout(100)
    await assertLightTheme()

    // Switch to dark
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForTimeout(100)
    await assertDarkTheme()

    // Switch back to light
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForTimeout(100)
    await assertLightTheme()
  })
})
