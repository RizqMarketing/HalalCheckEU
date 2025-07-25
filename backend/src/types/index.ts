/**
 * HalalCheck EU - Type Exports
 * 
 * Central export file for all platform types
 */

export * from './auth'
export * from './halal'

// Additional subscription plan details interface
export interface SubscriptionPlanDetails {
  name: string
  monthlyLimit: number
  price: number
  currency: string
  features: string[]
}