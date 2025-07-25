/**
 * HalalCheck EU - Authentication E2E Tests
 */

import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    await page.click('text=Login')
    
    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.locator('h1')).toContainText('Sign in to your account')
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'invalid-email')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'test@halalcheck.eu')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
  })

  test('should display registration page', async ({ page }) => {
    await page.click('text=Register')
    
    await expect(page).toHaveURL(/.*\/register/)
    await expect(page.locator('h1')).toContainText('Create your account')
    await expect(page.locator('[data-testid="first-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="last-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="organization-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="register-button"]')).toBeVisible()
  })

  test('should register new user with valid data', async ({ page }) => {
    await page.goto('/register')
    
    const timestamp = Date.now()
    
    await page.fill('[data-testid="first-name-input"]', 'Test')
    await page.fill('[data-testid="last-name-input"]', 'User')
    await page.fill('[data-testid="email-input"]', `test${timestamp}@example.com`)
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.fill('[data-testid="organization-name-input"]', 'Test Organization')
    await page.selectOption('[data-testid="organization-type-select"]', 'FOOD_MANUFACTURER')
    await page.selectOption('[data-testid="country-select"]', 'Netherlands')
    await page.fill('[data-testid="phone-input"]', '+31612345678')
    await page.check('[data-testid="terms-checkbox"]')
    
    await page.click('[data-testid="register-button"]')
    
    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('text=Welcome to HalalCheck EU')).toBeVisible()
  })

  test('should show password strength indicator', async ({ page }) => {
    await page.goto('/register')
    
    // Weak password
    await page.fill('[data-testid="password-input"]', 'weak')
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Weak')
    
    // Medium password
    await page.fill('[data-testid="password-input"]', 'MediumPass123')
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Medium')
    
    // Strong password
    await page.fill('[data-testid="password-input"]', 'StrongPass123!')
    await expect(page.locator('[data-testid="password-strength"]')).toContainText('Strong')
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@halalcheck.eu')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Then logout
    await page.click('[data-testid="user-menu"]')
    await page.click('text=Logout')
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=Login')).toBeVisible()
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('text=Forgot password?')
    await expect(page).toHaveURL(/.*\/reset-password/)
    
    await page.fill('[data-testid="email-input"]', 'test@halalcheck.eu')
    await page.click('[data-testid="reset-button"]')
    
    await expect(page.locator('text=Password reset email sent')).toBeVisible()
  })

  test('should protect dashboard route when not authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.locator('text=Please sign in to access your dashboard')).toBeVisible()
  })

  test('should persist session across page refreshes', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@halalcheck.eu')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Refresh page
    await page.reload()
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/.*\/dashboard/)
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should handle session expiry gracefully', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@halalcheck.eu')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.click('[data-testid="login-button"]')
    
    await expect(page).toHaveURL(/.*\/dashboard/)
    
    // Simulate expired session by clearing localStorage
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access protected resource
    await page.goto('/analysis')
    
    // Should redirect to login with session expired message
    await expect(page).toHaveURL(/.*\/login/)
    await expect(page.locator('text=Your session has expired')).toBeVisible()
  })
})