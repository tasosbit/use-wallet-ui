import { test, expect } from '@playwright/test'

/**
 * Tests for CSS customization patterns in the react-custom example.
 * These tests verify that the v1.0 CSS architecture allows proper customization
 * without breaking the library's default styles.
 *
 * Run with: pnpm e2e --project=customization
 */
test.describe('CSS Customization Patterns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-ui]')
  })

  test('page loads with all customization examples', async ({ page }) => {
    // Verify all 7 examples are visible
    await expect(page.getByText('1. Default Button')).toBeVisible()
    await expect(page.getByText('2. Size Variants')).toBeVisible()
    await expect(page.getByText('3. CSS Variable Overrides')).toBeVisible()
    await expect(page.getByText('4. Inline Style Overrides')).toBeVisible()
    await expect(page.getByText('5. Direct CSS Override')).toBeVisible()
    await expect(page.getByText('6. Theme-Aware Customization')).toBeVisible()
    await expect(page.getByText('7. Fully Custom Trigger')).toBeVisible()
  })

  test('default button has library primary color', async ({ page }) => {
    // Find the default button (first WalletButton in example 1)
    const defaultSection = page.locator('section').filter({ hasText: '1. Default Button' })
    const button = defaultSection.locator('[data-wallet-button]')

    const bgColor = await button.evaluate((el) => getComputedStyle(el).backgroundColor)

    // Default primary color is #2d2df1 = rgb(45, 45, 241)
    expect(bgColor).toBe('rgb(45, 45, 241)')
  })

  test('size variants render at different heights', async ({ page }) => {
    const sizeSection = page.locator('section').filter({ hasText: '2. Size Variants' })

    // Get all three size buttons
    const buttons = sizeSection.locator('[data-wallet-button]')
    const smallButton = buttons.nth(0)
    const mediumButton = buttons.nth(1)
    const largeButton = buttons.nth(2)

    const smallHeight = await smallButton.evaluate((el) => (el as HTMLElement).offsetHeight)
    const mediumHeight = await mediumButton.evaluate((el) => (el as HTMLElement).offsetHeight)
    const largeHeight = await largeButton.evaluate((el) => (el as HTMLElement).offsetHeight)

    // Verify sizes are different and in correct order
    expect(smallHeight).toBeLessThan(mediumHeight)
    expect(mediumHeight).toBeLessThan(largeHeight)

    // Verify approximate expected sizes (sm: 32px, md: 40px, lg: 48px)
    expect(smallHeight).toBeGreaterThanOrEqual(30)
    expect(smallHeight).toBeLessThanOrEqual(36)
    expect(mediumHeight).toBeGreaterThanOrEqual(38)
    expect(mediumHeight).toBeLessThanOrEqual(44)
    expect(largeHeight).toBeGreaterThanOrEqual(46)
    expect(largeHeight).toBeLessThanOrEqual(52)
  })

  test('CSS variable override changes button color (purple theme)', async ({ page }) => {
    const purpleSection = page.locator('section').filter({ hasText: '3. CSS Variable Overrides' })
    const button = purpleSection.locator('[data-wallet-button]')

    const bgColor = await button.evaluate((el) => getComputedStyle(el).backgroundColor)

    // Purple theme: #8b5cf6 = rgb(139, 92, 246)
    expect(bgColor).toBe('rgb(139, 92, 246)')
  })

  test('inline style override changes button color (green)', async ({ page }) => {
    const greenSection = page.locator('section').filter({ hasText: '4. Inline Style Overrides' })
    const button = greenSection.locator('[data-wallet-button]')

    const bgColor = await button.evaluate((el) => getComputedStyle(el).backgroundColor)

    // Green inline style: #10b981 = rgb(16, 185, 129)
    expect(bgColor).toBe('rgb(16, 185, 129)')
  })

  test('direct CSS override applies pill shape', async ({ page }) => {
    const pillSection = page.locator('section').filter({ hasText: '5. Direct CSS Override' })
    const button = pillSection.locator('[data-wallet-button]')

    const borderRadius = await button.evaluate((el) => getComputedStyle(el).borderRadius)

    // Pill shape has border-radius: 9999px
    expect(borderRadius).toBe('9999px')
  })

  test('custom trigger button is not affected by library resets', async ({ page }) => {
    const customSection = page.locator('section').filter({ hasText: '7. Fully Custom Trigger' })
    const customButton = customSection.locator('.custom-button')

    // Custom button should exist and have custom styling
    await expect(customButton).toBeVisible()

    // Verify it doesn't have the library's button styles
    const bgColor = await customButton.evaluate((el) => getComputedStyle(el).backgroundColor)
    // Custom button has transparent background
    expect(bgColor).toBe('rgba(0, 0, 0, 0)')

    // Verify custom border styling is preserved
    const borderRadius = await customButton.evaluate((el) => getComputedStyle(el).borderRadius)
    expect(borderRadius).toBe('8px') // 0.5rem = 8px
  })

  test('custom trigger opens connect wallet modal', async ({ page }) => {
    const customSection = page.locator('section').filter({ hasText: '7. Fully Custom Trigger' })
    const customButton = customSection.locator('.custom-button')

    await customButton.click()

    // Modal should open
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Modal should have "Connect a Wallet" heading
    await expect(dialog.getByText('Connect a Wallet')).toBeVisible()
  })
})

test.describe('Theme Switching', () => {
  test('amber theme changes color on dark mode toggle', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-ui]')

    const amberSection = page.locator('section').filter({ hasText: '6. Theme-Aware Customization' })
    const button = amberSection.locator('[data-wallet-button]')

    // Get light mode color
    const lightBgColor = await button.evaluate((el) => getComputedStyle(el).backgroundColor)
    // Amber in light mode: #f59e0b = rgb(245, 158, 11)
    expect(lightBgColor).toBe('rgb(245, 158, 11)')

    // Switch to dark mode
    await page.locator('select').selectOption('dark')
    await page.waitForTimeout(100)

    // Get dark mode color
    const darkBgColor = await button.evaluate((el) => getComputedStyle(el).backgroundColor)
    // Amber in dark mode is semi-transparent, should be different from light mode
    expect(darkBgColor).not.toBe(lightBgColor)
    // Should contain rgba (semi-transparent)
    expect(darkBgColor).toMatch(/^rgba\(/)
  })
})
