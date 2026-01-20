import { test, expect } from '@playwright/test'

// Visual regression tests use Linux baselines (generated via Docker)
// Update snapshots: pnpm --filter @txnlab/use-wallet-ui-e2e e2e:update:docker
test.describe('Visual Regression - Light Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-wallet-theme]')
    await page.locator('select').selectOption('light')
    // Wait for fonts and images to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
  })

  test('full page screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('light-mode-full-page.png', {
      fullPage: true,
    })
  })

  test('connect wallet button', async ({ page }) => {
    const button = page.locator('button:has-text("Connect Wallet")')
    await expect(button).toHaveScreenshot('light-connect-button.png')
  })

  test('connect wallet button hover state', async ({ page }) => {
    const button = page.locator('button:has-text("Connect Wallet")')
    await button.hover()
    await page.waitForTimeout(100)
    await expect(button).toHaveScreenshot('light-connect-button-hover.png')
  })

  test('connect wallet modal', async ({ page }) => {
    await page.click('button:has-text("Connect Wallet")')
    await page.waitForSelector('[role="dialog"]')
    // Wait for modal animation
    await page.waitForTimeout(300)

    const modal = page.locator('[role="dialog"]')
    await expect(modal).toHaveScreenshot('light-connect-modal.png')
  })

  test('modal with overlay', async ({ page }) => {
    await page.click('button:has-text("Connect Wallet")')
    await page.waitForSelector('[role="dialog"]')
    await page.waitForTimeout(300)

    // Full page to capture overlay effect
    await expect(page).toHaveScreenshot('light-modal-with-overlay.png')
  })
})
