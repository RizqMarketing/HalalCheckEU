/**
 * HalalCheck EU - Analysis E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Ingredient Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@halalcheck.eu')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/.*\/dashboard/)
  })

  test('should display analysis form', async ({ page }) => {
    await page.goto('/analysis')
    
    await expect(page.locator('h1')).toContainText('Analyze Product Ingredients')
    await expect(page.locator('[data-testid="product-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="ingredient-list-textarea"]')).toBeVisible()
    await expect(page.locator('[data-testid="category-select"]')).toBeVisible()
    await expect(page.locator('[data-testid="region-select"]')).toBeVisible()
    await expect(page.locator('[data-testid="analyze-button"]')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.click('[data-testid="analyze-button"]')
    
    await expect(page.locator('text=Product name is required')).toBeVisible()
    await expect(page.locator('text=Ingredient list is required')).toBeVisible()
  })

  test('should validate ingredient list minimum length', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Test Product')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'a')
    await page.click('[data-testid="analyze-button"]')
    
    await expect(page.locator('text=Ingredient list must be at least 10 characters')).toBeVisible()
  })

  test('should analyze halal ingredients successfully', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Halal Cookies')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'wheat flour, sugar, vegetable oil, salt, baking powder')
    await page.selectOption('[data-testid="category-select"]', 'FOOD_BEVERAGE')
    await page.selectOption('[data-testid="region-select"]', 'EU')
    
    await page.click('[data-testid="analyze-button"]')
    
    // Should show loading state
    await expect(page.locator('[data-testid="analyzing-spinner"]')).toBeVisible()
    await expect(page.locator('text=Analyzing ingredients')).toBeVisible()
    
    // Wait for results
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
    
    // Should show results
    await expect(page.locator('[data-testid="overall-status"]')).toContainText('HALAL')
    await expect(page.locator('[data-testid="risk-level"]')).toBeVisible()
    await expect(page.locator('[data-testid="ingredient-breakdown"]')).toBeVisible()
    await expect(page.locator('[data-testid="save-analysis-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="generate-report-button"]')).toBeVisible()
  })

  test('should detect haram ingredients', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Pork Sausage')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'pork meat, beef, salt, spices, sodium nitrite')
    await page.selectOption('[data-testid="category-select"]', 'FOOD_BEVERAGE')
    
    await page.click('[data-testid="analyze-button"]')
    
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
    
    await expect(page.locator('[data-testid="overall-status"]')).toContainText('HARAM')
    await expect(page.locator('[data-testid="risk-level"]')).toContainText('VERY_HIGH')
    
    // Should highlight problematic ingredients
    await expect(page.locator('[data-testid="haram-ingredient"]')).toContainText('pork meat')
  })

  test('should identify mashbooh (doubtful) ingredients', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Cheese Product')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'milk, cheese culture, rennet, salt')
    await page.selectOption('[data-testid="category-select"]', 'FOOD_BEVERAGE')
    
    await page.click('[data-testid="analyze-button"]')
    
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
    
    await expect(page.locator('[data-testid="overall-status"]')).toContainText('MASHBOOH')
    await expect(page.locator('[data-testid="expert-review-required"]')).toBeVisible()
    
    // Should show alternative suggestions
    await expect(page.locator('[data-testid="ingredient-alternatives"]')).toBeVisible()
  })

  test('should handle image upload for OCR', async ({ page }) => {
    await page.goto('/analysis')
    
    // Switch to image upload tab
    await page.click('[data-testid="image-upload-tab"]')
    
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible()
    await expect(page.locator('text=Upload ingredient image')).toBeVisible()
    
    // Mock file upload
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles({
      name: 'ingredients.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake image content')
    })
    
    await expect(page.locator('[data-testid="uploaded-file"]')).toContainText('ingredients.jpg')
    await expect(page.locator('[data-testid="ocr-analyze-button"]')).toBeEnabled()
  })

  test('should reject invalid file types', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.click('[data-testid="image-upload-tab"]')
    
    const fileInput = page.locator('[data-testid="file-input"]')
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content')
    })
    
    await expect(page.locator('text=Only image files are allowed')).toBeVisible()
  })

  test('should save analysis to history', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Test Product for History')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'water, sugar, natural flavoring')
    await page.click('[data-testid="analyze-button"]')
    
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
    
    await page.click('[data-testid="save-analysis-button"]')
    
    await expect(page.locator('text=Analysis saved successfully')).toBeVisible()
    
    // Check if it appears in history
    await page.goto('/analysis/history')
    
    await expect(page.locator('text=Test Product for History')).toBeVisible()
  })

  test('should generate and download report', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Report Test Product')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'water, sugar, salt')
    await page.click('[data-testid="analyze-button"]')
    
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
    
    // Mock download
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="generate-report-button"]')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/report.*\.pdf/)
  })

  test('should show advanced options when toggled', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.click('[data-testid="advanced-options-toggle"]')
    
    await expect(page.locator('[data-testid="confidence-threshold"]')).toBeVisible()
    await expect(page.locator('[data-testid="analysis-language"]')).toBeVisible()
    await expect(page.locator('[data-testid="conservative-mode"]')).toBeVisible()
  })

  test('should adjust confidence threshold', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.click('[data-testid="advanced-options-toggle"]')
    
    const slider = page.locator('[data-testid="confidence-threshold"]')
    await slider.fill('0.9')
    
    await expect(page.locator('[data-testid="confidence-value"]')).toContainText('90%')
  })

  test('should handle analysis errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('/api/analysis/analyze', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Analysis service temporarily unavailable'
        })
      })
    })
    
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Error Test Product')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'water, sugar')
    await page.click('[data-testid="analyze-button"]')
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Analysis service temporarily unavailable')
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible()
  })

  test('should show ingredient details on click', async ({ page }) => {
    await page.goto('/analysis')
    
    await page.fill('[data-testid="product-name-input"]', 'Detail Test Product')
    await page.fill('[data-testid="ingredient-list-textarea"]', 'water, sugar, salt, natural flavoring')
    await page.click('[data-testid="analyze-button"]')
    
    await page.waitForSelector('[data-testid="analysis-results"]', { timeout: 30000 })
    
    // Click on first ingredient
    await page.click('[data-testid="ingredient-item"]:first-child')
    
    // Should show ingredient details modal
    await expect(page.locator('[data-testid="ingredient-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="ingredient-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="halal-status"]')).toBeVisible()
    await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible()
    await expect(page.locator('[data-testid="reasoning"]')).toBeVisible()
  })

  test('should filter analysis history', async ({ page }) => {
    await page.goto('/analysis/history')
    
    // Filter by status
    await page.selectOption('[data-testid="status-filter"]', 'HALAL')
    
    // All visible items should be halal
    const statusLabels = page.locator('[data-testid="analysis-status"]')
    await expect(statusLabels.first()).toContainText('HALAL')
    
    // Filter by date range
    await page.fill('[data-testid="date-from"]', '2023-01-01')
    await page.fill('[data-testid="date-to"]', '2023-12-31')
    
    await page.click('[data-testid="apply-filters"]')
    
    await expect(page.locator('[data-testid="results-count"]')).toBeVisible()
  })

  test('should search analysis history', async ({ page }) => {
    await page.goto('/analysis/history')
    
    await page.fill('[data-testid="search-input"]', 'Test Product')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    const productNames = page.locator('[data-testid="product-name"]')
    await expect(productNames.first()).toContainText('Test Product')
  })
})