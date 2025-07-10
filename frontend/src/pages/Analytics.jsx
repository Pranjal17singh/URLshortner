import React, { useState, useEffect } from 'react'
import { urlAPI, analyticsAPI } from '../utils/api'
import toast from 'react-hot-toast'
import {
  BarChart3,
  Users,
  MousePointer,
  TrendingUp,
  Globe,
  Smartphone,
  Clock,
  ExternalLink,
  Eye,
  Calendar
} from 'lucide-react'

const Analytics = () => {
  const [urls, setUrls] = useState([])
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [overallStats, setOverallStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const urlsResponse = await urlAPI.getUrls()
      setUrls(urlsResponse.data.urls || [])
      
      // Load overall analytics
      try {
        const overallResponse = await analyticsAPI.getOverallAnalytics(timeRange)
        setOverallStats(overallResponse.data)
      } catch (analyticsError) {
        console.error('Analytics API error:', analyticsError)
        // Set default stats if analytics endpoint fails
        setOverallStats({
          totalClicks: 0,
          totalLeads: 0,
          activeUrls: urlsResponse.data.urls?.length || 0
        })
      }
    } catch (error) {
      console.error('Load data error:', error)
      toast.error('Failed to load analytics')
      setUrls([])
      setOverallStats({
        totalClicks: 0,
        totalLeads: 0,
        activeUrls: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUrlAnalytics = async (urlId) => {
    try {
      const response = await urlAPI.getUrlStats(urlId)
      setAnalytics(response.data.stats)
      setSelectedUrl(urlId)
    } catch (error) {
      toast.error('Failed to load URL analytics')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getConversionRate = (leads, clicks) => {
    return clicks > 0 ? ((leads / clicks) * 100).toFixed(1) : '0'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card h-24 bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Track performance across all your URLs and campaigns</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalClicks}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MousePointer className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.totalLeads}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getConversionRate(overallStats.totalLeads, overallStats.totalClicks)}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active URLs</p>
                <p className="text-2xl font-bold text-gray-900">{overallStats.activeUrls}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* URLs List */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Your URLs</h3>
              <span className="text-sm text-gray-500">{urls?.length || 0} total</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {urls?.map((url) => (
                <div
                  key={url.id}
                  onClick={() => loadUrlAnalytics(url.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedUrl === url.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {url.title || 'Untitled'}
                        </h4>
                        {url.form && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Form
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">/{url.customAlias || url.shortCode}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center space-x-1">
                          <MousePointer className="h-3 w-3" />
                          <span>{url.clicks}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{url.leads}</span>
                        </span>
                        <span>{getConversionRate(url.leads, url.clicks)}%</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analytics Details */}
        <div className="lg:col-span-2">
          {selectedUrl && analytics ? (
            <div className="space-y-6">
              {/* URL Performance */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{analytics.totalClicks}</p>
                    <p className="text-sm text-gray-600">Total Clicks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{analytics.totalLeads}</p>
                    <p className="text-sm text-gray-600">Total Leads</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{analytics.conversionRate}%</p>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          activity.eventType === 'click' ? 'bg-blue-100' :
                          activity.eventType === 'form_submit' ? 'bg-green-100' :
                          activity.eventType === 'form_view' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          {activity.eventType === 'click' && <MousePointer className="h-4 w-4 text-blue-600" />}
                          {activity.eventType === 'form_submit' && <Users className="h-4 w-4 text-green-600" />}
                          {activity.eventType === 'form_view' && <Eye className="h-4 w-4 text-yellow-600" />}
                          {activity.eventType === 'redirect' && <ExternalLink className="h-4 w-4 text-gray-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.eventType === 'click' && 'URL Clicked'}
                            {activity.eventType === 'form_submit' && 'Form Submitted'}
                            {activity.eventType === 'form_view' && 'Form Viewed'}
                            {activity.eventType === 'redirect' && 'User Redirected'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.browser && `${activity.browser} • `}
                            {activity.device && `${activity.device} • `}
                            {activity.country || 'Unknown location'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatDate(activity.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device & Browser Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Devices</h3>
                  <div className="space-y-3">
                    {['Desktop', 'Mobile', 'Tablet'].map((device, index) => {
                      const count = analytics.recentActivity.filter(a => a.device === device).length
                      const percentage = analytics.recentActivity.length > 0 
                        ? ((count / analytics.recentActivity.length) * 100).toFixed(1)
                        : 0
                      return (
                        <div key={device} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Smartphone className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-900">{device}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Locations</h3>
                  <div className="space-y-3">
                    {['United States', 'India', 'United Kingdom'].map((country, index) => {
                      const count = analytics.recentActivity.filter(a => a.country === country).length
                      const percentage = analytics.recentActivity.length > 0 
                        ? ((count / analytics.recentActivity.length) * 100).toFixed(1)
                        : 0
                      return (
                        <div key={country} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-900">{country}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 w-8">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a URL to view analytics</h3>
                <p className="text-gray-600">Click on any URL from the list to see detailed performance metrics</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Analytics