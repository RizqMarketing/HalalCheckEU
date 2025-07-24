'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AnalyticsData {
  certificatesIssued: number
  applicationsReceived: number
  averageProcessingTime: number
  clientSatisfaction: number
  revenueGenerated: number
  monthlyGrowth: number
  topClients: Array<{
    name: string
    company: string
    certificates: number
    revenue: number
  }>
  monthlyStats: Array<{
    month: string
    certificates: number
    applications: number
    revenue: number
  }>
  categoryBreakdown: Array<{
    category: string
    count: number
    percentage: number
  }>
  statusDistribution: Array<{
    status: string
    count: number
    color: string
  }>
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('12months')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    
    // Simulate API call with realistic data
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockData: AnalyticsData = {
      certificatesIssued: 247,
      applicationsReceived: 312,
      averageProcessingTime: 3.2,
      clientSatisfaction: 4.8,
      revenueGenerated: 89750,
      monthlyGrowth: 18.5,
      topClients: [
        { name: 'Ahmed Hassan', company: 'Middle East Foods Ltd', certificates: 12, revenue: 8400 },
        { name: 'Fatima Al-Zahra', company: 'Istanbul Bakery Chain', certificates: 9, revenue: 6300 },
        { name: 'Omar Mansouri', company: 'Mediterranean Spices Co', certificates: 8, revenue: 5600 },
        { name: 'Khadija Rahman', company: 'European Halal Meats', certificates: 7, revenue: 4900 },
        { name: 'Mohammed Boutros', company: 'Halal Pharmaceuticals BV', certificates: 6, revenue: 4200 }
      ],
      monthlyStats: [
        { month: 'Jan', certificates: 18, applications: 23, revenue: 6300 },
        { month: 'Feb', certificates: 22, applications: 28, revenue: 7700 },
        { month: 'Mar', certificates: 25, applications: 32, revenue: 8750 },
        { month: 'Apr', certificates: 20, applications: 26, revenue: 7000 },
        { month: 'May', certificates: 28, applications: 35, revenue: 9800 },
        { month: 'Jun', certificates: 24, applications: 30, revenue: 8400 },
        { month: 'Jul', certificates: 26, applications: 33, revenue: 9100 },
        { month: 'Aug', certificates: 23, applications: 29, revenue: 8050 },
        { month: 'Sep', certificates: 29, applications: 36, revenue: 10150 },
        { month: 'Oct', certificates: 32, applications: 40, revenue: 11200 },
        { month: 'Nov', certificates: 28, applications: 35, revenue: 9800 },
        { month: 'Dec', certificates: 31, applications: 39, revenue: 10850 }
      ],
      categoryBreakdown: [
        { category: 'Food Products', count: 128, percentage: 52 },
        { category: 'Beverages', count: 45, percentage: 18 },
        { category: 'Cosmetics', count: 32, percentage: 13 },
        { category: 'Pharmaceuticals', count: 25, percentage: 10 },
        { category: 'Others', count: 17, percentage: 7 }
      ],
      statusDistribution: [
        { status: 'Active', count: 198, color: 'bg-green-500' },
        { status: 'Expired', count: 32, color: 'bg-amber-500' },
        { status: 'Pending', count: 15, color: 'bg-blue-500' },
        { status: 'Revoked', count: 2, color: 'bg-red-500' }
      ]
    }

    setAnalyticsData(mockData)
    setIsLoading(false)
  }

  if (isLoading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value}%`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-red-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-red-800 bg-clip-text text-transparent">
                  Analytics Reports
                </h1>
                <p className="text-slate-600 text-sm">
                  Business insights & compliance reporting
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="12months">Last 12 Months</option>
                <option value="2years">Last 2 Years</option>
              </select>
              <Link 
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{analyticsData.certificatesIssued}</div>
                <div className="text-sm text-slate-600">Certificates Issued</div>
                <div className="text-xs text-emerald-600 font-medium mt-1">
                  {formatPercentage(analyticsData.monthlyGrowth)} vs last period
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{analyticsData.applicationsReceived}</div>
                <div className="text-sm text-slate-600">Applications Received</div>
                <div className="text-xs text-blue-600 font-medium mt-1">
                  {((analyticsData.certificatesIssued / analyticsData.applicationsReceived) * 100).toFixed(1)}% conversion rate
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{formatCurrency(analyticsData.revenueGenerated)}</div>
                <div className="text-sm text-slate-600">Revenue Generated</div>
                <div className="text-xs text-purple-600 font-medium mt-1">
                  {formatCurrency(analyticsData.revenueGenerated / analyticsData.certificatesIssued)} avg per cert
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-1">
                  <div className="text-2xl font-bold text-slate-900">{analyticsData.clientSatisfaction}</div>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-slate-600">Client Satisfaction</div>
                <div className="text-xs text-amber-600 font-medium mt-1">
                  Based on 127 reviews
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Performance Chart */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Monthly Performance</h3>
            <div className="space-y-4">
              {analyticsData.monthlyStats.slice(-6).map((stat, index) => (
                <div key={stat.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-sm font-medium text-slate-600">{stat.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">{stat.certificates} certificates</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">{stat.applications} applications</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{formatCurrency(stat.revenue)}</div>
                    <div className="w-32 h-2 bg-slate-200 rounded-full mt-1">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                        style={{ width: `${(stat.revenue / 12000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Certificate Categories</h3>
            <div className="space-y-4">
              {analyticsData.categoryBreakdown.map((category, index) => {
                const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-red-500']
                return (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 ${colors[index]} rounded-full`}></div>
                      <span className="text-sm font-medium text-slate-700">{category.category}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 h-2 bg-slate-200 rounded-full">
                        <div 
                          className={`h-full ${colors[index]} rounded-full`}
                          style={{ width: `${category.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 w-8">{category.count}</span>
                      <span className="text-xs text-slate-500 w-8">{category.percentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Status Distribution & Top Clients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Certificate Status Distribution */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Certificate Status</h3>
            <div className="grid grid-cols-2 gap-4">
              {analyticsData.statusDistribution.map((status) => (
                <div key={status.status} className="text-center">
                  <div className={`w-16 h-16 ${status.color} rounded-2xl flex flex-col items-center justify-center mx-auto mb-2`}>
                    <div className="text-white font-bold text-lg">{status.count}</div>
                  </div>
                  <div className="text-sm font-medium text-slate-700">{status.status}</div>
                  <div className="text-xs text-slate-500">
                    {((status.count / analyticsData.statusDistribution.reduce((sum, s) => sum + s.count, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Clients */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Top Clients</h3>
            <div className="space-y-4">
              {analyticsData.topClients.map((client, index) => (
                <div key={client.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{client.name}</div>
                      <div className="text-sm text-slate-600">{client.company}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">{formatCurrency(client.revenue)}</div>
                    <div className="text-xs text-slate-500">{client.certificates} certificates</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export & Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Export Reports</h3>
              <p className="text-sm text-slate-600">Generate detailed reports for compliance and business analysis</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </button>
              <button className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a4 4 0 01-4-4V5a4 4 0 014-4h2m7 4v6a4 4 0 01-4 4H9.5" />
                </svg>
                <span>Export Excel</span>
              </button>
              <button className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15" />
                </svg>
                <span>Custom Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}