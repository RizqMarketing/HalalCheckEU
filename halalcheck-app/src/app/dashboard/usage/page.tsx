'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function UsagePage() {
  const [stats, setStats] = useState({
    currentPeriod: {
      analysesUsed: 23,
      analysesLimit: 50,
      periodStart: '2024-01-15',
      periodEnd: '2024-01-29'
    },
    dailyUsage: [
      { date: '2024-01-15', count: 3 },
      { date: '2024-01-16', count: 1 },
      { date: '2024-01-17', count: 5 },
      { date: '2024-01-18', count: 2 },
      { date: '2024-01-19', count: 4 },
      { date: '2024-01-20', count: 3 },
      { date: '2024-01-21', count: 0 },
      { date: '2024-01-22', count: 5 }
    ],
    topCategories: [
      { name: 'Confectionery', count: 8, percentage: 35 },
      { name: 'Beverages', count: 6, percentage: 26 },
      { name: 'Processed Foods', count: 5, percentage: 22 },
      { name: 'Dairy Products', count: 4, percentage: 17 }
    ]
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  const usagePercentage = (stats.currentPeriod.analysesUsed / stats.currentPeriod.analysesLimit) * 100

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Usage */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Current Trial Usage</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {stats.currentPeriod.analysesUsed}
              </div>
              <div className="text-sm text-gray-600">Analyses Used</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {stats.currentPeriod.analysesLimit - stats.currentPeriod.analysesUsed}
              </div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {Math.round(usagePercentage)}%
              </div>
              <div className="text-sm text-gray-600">Usage Rate</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{stats.currentPeriod.analysesUsed} / {stats.currentPeriod.analysesLimit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Daily Usage Chart */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Daily Usage (Last 8 Days)</h2>
          
          <div className="flex items-end justify-between h-64 space-x-2">
            {stats.dailyUsage.map((day, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className="bg-green-500 rounded-t-md w-full transition-all duration-300 hover:bg-green-600"
                  style={{ height: `${(day.count / 5) * 100}%`, minHeight: day.count > 0 ? '10px' : '2px' }}
                ></div>
                <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-top-left">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  {day.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Product Categories</h2>
          
          <div className="space-y-4">
            {stats.topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {category.count} ({category.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Need More Analyses?
              </h3>
              <p className="text-gray-600">
                Upgrade to get unlimited analyses and premium features
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}