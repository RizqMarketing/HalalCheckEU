/**
 * HalalCheck EU - Ingredient Analysis Tests
 * 
 * Comprehensive unit tests for ingredient analysis functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { IngredientAnalysisService } from '../src/services/ingredientAnalysisService'
import { HalalStatus, RiskLevel } from '../src/types'
import { pool } from '../src/database/connection'

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}))

describe('IngredientAnalysisService', () => {
  let service: IngredientAnalysisService
  let mockOpenAI: any

  beforeEach(async () => {
    service = new IngredientAnalysisService()
    
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Test%')
    await pool.query('DELETE FROM ingredients WHERE name LIKE %test%')
    
    // Insert test ingredients
    await pool.query(`
      INSERT INTO ingredients (name, halal_status, risk_level, description, sources, region)
      VALUES 
        ('water', 'HALAL', 'VERY_LOW', 'Pure water is always halal', 'Universal', 'GLOBAL'),
        ('pork gelatin', 'HARAM', 'VERY_HIGH', 'Gelatin derived from pork', 'Animal', 'GLOBAL'),
        ('vanilla extract', 'MASHBOOH', 'MEDIUM', 'May contain alcohol', 'Plant', 'GLOBAL'),
        ('lecithin', 'MASHBOOH', 'MEDIUM', 'Source must be verified', 'Plant/Animal', 'GLOBAL')
    `)

    // Mock OpenAI response
    mockOpenAI = require('openai').OpenAI
    mockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  ingredients: [
                    {
                      name: 'water',
                      confidence: 0.99,
                      original_text: 'water'
                    },
                    {
                      name: 'sugar',
                      confidence: 0.95,
                      original_text: 'sugar'
                    }
                  ],
                  language_detected: 'en',
                  processing_notes: 'Successfully parsed ingredient list'
                })
              }
            }]
          })
        }
      }
    }))
  })

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Test%')
    await pool.query('DELETE FROM ingredients WHERE name LIKE %test%')
    jest.clearAllMocks()
  })

  describe('analyzeIngredients', () => {
    it('should analyze ingredients successfully', async () => {
      const analysisRequest = {
        productName: 'Test Product',
        ingredientText: 'water, sugar, salt',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      const result = await service.analyzeIngredients(analysisRequest)

      expect(result).toHaveProperty('id')
      expect(result.productName).toBe('Test Product')
      expect(result.ingredients).toHaveLength(2) // water and sugar
      expect(result.overallStatus).toBeDefined()
      expect(result.overallRiskLevel).toBeDefined()
      expect(result.summary).toHaveProperty('total_ingredients')
      expect(result.recommendations).toBeDefined()
    })

    it('should detect haram ingredients', async () => {
      // Mock OpenAI to return pork gelatin
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              ingredients: [
                {
                  name: 'pork gelatin',
                  confidence: 0.98,
                  original_text: 'pork gelatin'
                }
              ],
              language_detected: 'en',
              processing_notes: 'Detected haram ingredient'
            })
          }
        }]
      })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const analysisRequest = {
        productName: 'Test Haram Product',
        ingredientText: 'pork gelatin',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      const result = await service.analyzeIngredients(analysisRequest)

      expect(result.overallStatus).toBe(HalalStatus.HARAM)
      expect(result.summary.haram_count).toBe(1)
      expect(result.ingredients[0].status).toBe(HalalStatus.HARAM)
      expect(result.ingredients[0].riskLevel).toBe(RiskLevel.VERY_HIGH)
    })

    it('should handle mashbooh ingredients requiring review', async () => {
      // Mock OpenAI to return vanilla extract
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              ingredients: [
                {
                  name: 'vanilla extract',
                  confidence: 0.95,
                  original_text: 'vanilla extract'
                }
              ],
              language_detected: 'en',
              processing_notes: 'Detected questionable ingredient'
            })
          }
        }]
      })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
          create: mockCreate
          }
        }
      }))

      const analysisRequest = {
        productName: 'Test Mashbooh Product',
        ingredientText: 'vanilla extract',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      const result = await service.analyzeIngredients(analysisRequest)

      expect(result.overallStatus).toBe(HalalStatus.MASHBOOH)
      expect(result.summary.mashbooh_count).toBe(1)
      expect(result.expertReviewRequired).toBe(true)
      expect(result.ingredients[0].requiresExpertReview).toBe(true)
    })

    it('should handle unknown ingredients conservatively', async () => {
      // Mock OpenAI to return unknown ingredient
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              ingredients: [
                {
                  name: 'unknown chemical compound xyz',
                  confidence: 0.60,
                  original_text: 'unknown chemical compound xyz'
                }
              ],
              language_detected: 'en',
              processing_notes: 'Unknown ingredient detected'
            })
          }
        }]
      })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const analysisRequest = {
        productName: 'Test Unknown Product',
        ingredientText: 'unknown chemical compound xyz',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      const result = await service.analyzeIngredients(analysisRequest)

      expect(result.expertReviewRequired).toBe(true)
      expect(result.ingredients[0].requiresExpertReview).toBe(true)
      expect(result.ingredients[0].warnings).toContain('Unknown ingredient - requires expert verification')
    })

    it('should provide appropriate recommendations', async () => {
      const analysisRequest = {
        productName: 'Mixed Status Product',
        ingredientText: 'water, pork gelatin, sugar',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      // Mock mixed ingredients
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              ingredients: [
                {
                  name: 'water',
                  confidence: 0.99,
                  original_text: 'water'
                },
                {
                  name: 'pork gelatin',
                  confidence: 0.98,
                  original_text: 'pork gelatin'
                },
                {
                  name: 'sugar',
                  confidence: 0.97,
                  original_text: 'sugar'
                }
              ],
              language_detected: 'en',
              processing_notes: 'Mixed halal status ingredients'
            })
          }
        }]
      })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const result = await service.analyzeIngredients(analysisRequest)

      expect(result.recommendations).toHaveLength.greaterThan(0)
      expect(result.recommendations.some(r => 
        r.includes('haram') || r.includes('substitute')
      )).toBe(true)
    })

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI to throw error
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'))

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const analysisRequest = {
        productName: 'Error Test Product',
        ingredientText: 'water, sugar',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      await expect(service.analyzeIngredients(analysisRequest))
        .rejects.toThrow('Failed to analyze ingredients with AI')
    })

    it('should handle malformed OpenAI responses', async () => {
      // Mock OpenAI to return malformed response
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'invalid json response'
          }
        }]
      })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const analysisRequest = {
        productName: 'Malformed Response Test',
        ingredientText: 'water, sugar',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      await expect(service.analyzeIngredients(analysisRequest))
        .rejects.toThrow('Invalid response format from AI service')
    })
  })

  describe('analyzeFromImage', () => {
    it('should extract text from image and analyze', async () => {
      // Mock both vision and chat completions
      const mockCreate = jest.fn()
        .mockResolvedValueOnce({
          // First call - vision API for text extraction
          choices: [{
            message: {
              content: 'Ingredients: water, sugar, salt, natural flavoring'
            }
          }]
        })
        .mockResolvedValueOnce({
          // Second call - ingredient analysis
          choices: [{
            message: {
              content: JSON.stringify({
                ingredients: [
                  {
                    name: 'water',
                    confidence: 0.99,
                    original_text: 'water'
                  },
                  {
                    name: 'sugar',
                    confidence: 0.95,
                    original_text: 'sugar'
                  }
                ],
                language_detected: 'en',
                processing_notes: 'Extracted from image and analyzed'
              })
            }
          }]
        })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const imageData = Buffer.from('fake-image-data')
      const analysisRequest = {
        productName: 'Image Test Product',
        imageData,
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      const result = await service.analyzeFromImage(analysisRequest)

      expect(result).toHaveProperty('id')
      expect(result.productName).toBe('Image Test Product')
      expect(result.ingredients).toHaveLength(2)
      expect(mockCreate).toHaveBeenCalledTimes(2) // Vision + Analysis
    })
  })

  describe('getAnalysisById', () => {
    it('should retrieve existing analysis', async () => {
      // First create an analysis
      const analysisRequest = {
        productName: 'Retrieve Test Product',
        ingredientText: 'water, sugar',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      const created = await service.analyzeIngredients(analysisRequest)
      
      // Then retrieve it
      const retrieved = await service.getAnalysisById(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.productName).toBe('Retrieve Test Product')
    })

    it('should return null for non-existent analysis', async () => {
      const result = await service.getAnalysisById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('fuzzy matching', () => {
    it('should match similar ingredient names', async () => {
      // Test internal fuzzy matching logic
      const result = await service['fuzzyMatchIngredient']('lecithins')
      
      expect(result).toBeDefined()
      expect(result?.name).toBe('lecithin')
    })

    it('should handle typos in ingredient names', async () => {
      const result = await service['fuzzyMatchIngredient']('watter') // typo for water
      
      expect(result).toBeDefined()
      expect(result?.name).toBe('water')
    })

    it('should return null for completely unmatched ingredients', async () => {
      const result = await service['fuzzyMatchIngredient']('completely-unknown-ingredient-xyz-123')
      
      expect(result).toBeNull()
    })
  })

  describe('conservative analysis', () => {
    it('should err on the side of caution for low confidence matches', async () => {
      // Mock low confidence response
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              ingredients: [
                {
                  name: 'questionable ingredient',
                  confidence: 0.50, // Low confidence
                  original_text: 'questionable ingredient'
                }
              ],
              language_detected: 'en',
              processing_notes: 'Low confidence detection'
            })
          }
        }]
      })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const analysisRequest = {
        productName: 'Low Confidence Test',
        ingredientText: 'questionable ingredient',
        language: 'en',
        region: 'EU',
        userId: 'test-user-id',
        organizationId: 'test-org-id'
      }

      const result = await service.analyzeIngredients(analysisRequest)

      expect(result.expertReviewRequired).toBe(true)
      expect(result.ingredients[0].requiresExpertReview).toBe(true)
      expect(result.ingredients[0].warnings).toContain('Low confidence match - requires verification')
    })
  })
})