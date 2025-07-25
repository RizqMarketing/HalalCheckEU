/**
 * HalalCheck EU - Dashboard E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@halalcheck.eu')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should display dashboard overview', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard')
    
    // Statistics cards should be visible
    await expect(page.locator('[data-testid="total-analyses-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="halal-count-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="haram-count-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="mashbooh-count-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-reviews-card"]')).toBeVisible()
    
    // Charts should be visible
    await expect(page.locator('[data-testid="status-distribution-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="monthly-trends-chart"]')).toBeVisible()
  })

  test('should display correct statistics', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle')
    
    // Statistics should have numeric values
    const totalAnalyses = await page.locator('[data-testid="total-analyses-value"]').textContent()
    expect(totalAnalyses).toMatch(/^\d+/)
    
    const halalCount = await page.locator('[data-testid="halal-count-value"]').textContent()
    expect(halalCount).toMatch(/^\d+/)
    
    const haramCount = await page.locator('[data-testid="haram-count-value"]').textContent()
    expect(haramCount).toMatch(/^\d+/)
  })

  test('should display recent analyses', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-analyses-section"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Recent Analyses')
    
    // Should show analysis items
    const analysisItems = page.locator('[data-testid="analysis-item"]')
    await expect(analysisItems.first()).toBeVisible()
    
    // Each item should have required information
    await expect(page.locator('[data-testid="product-name"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="analysis-status"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="analysis-date"]').first()).toBeVisible()
  })

  test('should display usage statistics', async ({ page }) => {
    await expect(page.locator('[data-testid="usage-section"]')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Usage Statistics')
    
    // Usage progress bar should be visible
    await expect(page.locator('[data-testid="usage-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="current-usage"]')).toBeVisible()
    await expect(page.locator('[data-testid="usage-limit"]')).toBeVisible()
    await expect(page.locator('[data-testid="usage-percentage"]')).toBeVisible()
  })

  test('should navigate to analysis from quick actions', async ({ page }) => {
    await page.click('[data-testid="new-analysis-button"]')
    
    await expect(page).toHaveURL(/.*\/analysis/)
    await expect(page.locator('h1')).toContainText('Analyze Product Ingredients')
  })

  test('should navigate to history from recent analyses', async ({ page }) => {
    await page.click('[data-testid="view-all-analyses"]')
    
    await expect(page).toHaveURL(/.*\/analysis\/history/)
    await expect(page.locator('h1')).toContainText('Analysis History')
  })

  test('should display chart tooltips on hover', async ({ page }) => {
    // Hover over pie chart
    await page.hover('[data-testid="status-distribution-chart"] .recharts-pie-sector')
    
    await expect(page.locator('[data-testid="chart-tooltip"]')).toBeVisible()
  })

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    const initialCount = await page.locator('[data-testid="total-analyses-value"]').textContent()
    
    await page.click('[data-testid="refresh-dashboard"]')
    
    // Should show loading indicator
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' })
    
    // Data should be refreshed (assuming it might change)
    await expect(page.locator('[data-testid="total-analyses-value"]')).toBeVisible()
  })

  test('should display organization information for admin users', async ({ page }) => {
    // This test assumes the test user has admin privileges
    await expect(page.locator('[data-testid="organization-section"]')).toBeVisible()
    await expect(page.locator('[data-testid="organization-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="subscription-plan"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-count"]')).toBeVisible()
  })

  test('should show subscription upgrade prompt when near limit', async ({ page }) => {
    // Mock high usage scenario
    await page.route('/api/dashboard/usage', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            currentUsage: 950,
            monthlyLimit: 1000,
            planName: 'PROFESSIONAL'
          }
        })
      })
    })
    
    await page.reload()
    
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible()
    await expect(page.locator('text=approaching your monthly limit')).toBeVisible()
  })

  test('should display error state when data fails to load', async ({ page }) => {
    // Mock API error
    await page.route('/api/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Service temporarily unavailable'
        })
      })
    })
    
    await page.reload()
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('should show different content based on user role', async ({ page }) => {
    // Admin users should see management options
    if (await page.locator('[data-testid="admin-menu"]').isVisible()) {
      await expect(page.locator('[data-testid="user-management-link"]')).toBeVisible()
      await expect(page.locator('[data-testid="organization-settings-link"]')).toBeVisible()
    }
    
    // All users should see analysis options
    await expect(page.locator('[data-testid="new-analysis-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="view-history-button"]')).toBeVisible()
  })

  test('should display help tooltips', async ({ page }) => {
    await page.hover('[data-testid="help-icon-usage"]')
    
    await expect(page.locator('[data-testid="tooltip"]')).toBeVisible()
    await expect(page.locator('[data-testid="tooltip"]')).toContainText('Usage represents')
  })

  test('should handle empty state gracefully', async ({ page }) => {
    // Mock empty data response
    await page.route('/api/dashboard/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            totalAnalyses: 0,
            halalCount: 0,
            haramCount: 0,
            mashboohCount: 0,
            pendingReviews: 0,
            monthlyAnalyses: 0
          }
        })
      })
    })
    
    await page.route('/api/dashboard/recent-analyses', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: []
        })
      })
    })
    
    await page.reload()
    
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
    await expect(page.locator('text=No analyses yet')).toBeVisible()
    await expect(page.locator('[data-testid="get-started-button"]')).toBeVisible()
  })

  test('should update in real-time when new analysis is completed', async ({ page }) => {
    // This would require WebSocket mocking in a real scenario
    // For now, we'll test the UI update mechanism
    
    const initialCount = await page.locator('[data-testid="total-analyses-value"]').textContent()
    
    // Simulate real-time update
    await page.evaluate(() => {
      // Trigger a custom event that the app listens to
      window.dispatchEvent(new CustomEvent('analysisCompleted', {
        detail: { type: 'HALAL', productName: 'Test Product' }
      }))
    })
    
    // Check if notification appears
    await expect(page.locator('[data-testid="notification"]')).toContainText('New analysis completed')
  })

  test('should export dashboard data', async ({ page }) => {
    await page.click('[data-testid="export-dashboard"]')
    
    // Should show export options
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-pdf"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-excel"]')).toBeVisible()
    
    // Test PDF export
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="export-pdf"]')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/dashboard.*\.pdf/)
  })

  test('should handle responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Mobile navigation should be visible
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible()
    
    // Statistics should stack vertically
    const statsCards = page.locator('[data-testid$="-card"]')
    const firstCard = statsCards.first()
    const secondCard = statsCards.nth(1)
    
    const firstCardBox = await firstCard.boundingBox()
    const secondCardBox = await secondCard.boundingBox()
    
    // Second card should be below the first (higher y position)
    expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0)
  })
})