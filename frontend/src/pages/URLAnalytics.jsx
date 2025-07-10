import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/api'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Calendar,
  MousePointer,
  Users,
  TrendingUp,
  Globe,
  Smartphone,
  Monitor,
  Eye,
  CheckCircle,
  Download,
  FileText,
  User,
  Clock
} from 'lucide-react'
import copy from 'copy-to-clipboard'

const URLAnalytics = () => {
  const { id } = useParams()
  const [urlData, setUrlData] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [activeTab, setActiveTab] = useState('activity')
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [id, timeRange])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get URL data from Supabase
      const { data: urlData, error: urlError } = await supabase
        .from('urls')
        .select(`
          *,
          forms (
            id,
            name,
            fields,
            template_type
          )
        `)
        .eq('id', id)
        .single()
      
      if (urlError) {
        throw new Error(urlError.message)
      }
      
      // Get analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics')
        .select('*')
        .eq('url_id', id)
        .order('created_at', { ascending: false })
      
      if (analyticsError) {
        throw new Error(analyticsError.message)
      }
      
      // Get submissions data
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('url_id', id)
        .order('created_at', { ascending: false })
      
      if (submissionsError) {
        console.error('Submissions error:', submissionsError)
      }
      
      // Process analytics data
      const processedAnalytics = {
        totalClicks: analyticsData.filter(a => a.event_type === 'click').length,
        totalLeads: submissionsData?.length || 0,
        conversionRate: analyticsData.length > 0 
          ? ((submissionsData?.length || 0) / analyticsData.filter(a => a.event_type === 'click').length * 100).toFixed(1)
          : 0,
        recentActivity: analyticsData.slice(0, 20).map(a => ({
          eventType: a.event_type,
          createdAt: a.created_at,
          browser: 'Unknown',
          device: 'Unknown',
          country: 'Unknown'
        })),
        submissions: submissionsData?.map(s => ({
          id: s.id,
          data: s.submission_data,
          createdAt: s.created_at,
          ipAddress: s.ip_address
        })) || [],
        formFields: urlData.forms?.fields || []
      }
      
      setUrlData({
        ...urlData,
        form: urlData.forms
      })
      setAnalytics(processedAnalytics)
    } catch (error) {
      console.error('Load data error:', error)
      toast.error('Failed to load URL analytics')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!urlData) return
    const shortUrl = `${window.location.origin}/${urlData.customAlias || urlData.shortCode}`
    copy(shortUrl)
    toast.success('Short URL copied to clipboard!')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'click':
        return <MousePointer className="h-4 w-4 text-blue-600" />
      case 'form_view':
        return <Eye className="h-4 w-4 text-yellow-600" />
      case 'form_submit':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'redirect':
        return <ExternalLink className="h-4 w-4 text-purple-600" />
      default:
        return <Globe className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventLabel = (eventType) => {
    switch (eventType) {
      case 'click':
        return 'URL Clicked'
      case 'form_view':
        return 'Form Viewed'
      case 'form_submit':
        return 'Form Submitted'
      case 'redirect':
        return 'User Redirected'
      default:
        return 'Unknown Event'
    }
  }

  const exportToCsv = async () => {
    try {
      setExportLoading(true)
      
      if (!analytics.submissions || analytics.submissions.length === 0) {
        toast.error('No submissions to export')
        return
      }
      
      // Create CSV content
      const headers = Object.keys(analytics.submissions[0].data).join(',')
      const rows = analytics.submissions.map(submission => 
        Object.values(submission.data).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      )
      
      const csvContent = [headers, ...rows].join('\n')
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `submissions-${id}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setExportLoading(false)
    }
  }

  const renderSubmissionValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return value || 'N/A'
  }

  const getFieldLabel = (fieldId) => {
    if (!analytics.formFields) return fieldId
    const field = analytics.formFields.find(f => f.id === fieldId)
    return field ? field.label : fieldId
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="card h-24 bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!urlData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">URL not found</h3>
          <p className="text-gray-600 mb-4">The URL you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">URL Analytics</h1>
            <p className="text-gray-600">Detailed performance metrics for your short URL</p>
          </div>
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
          </select>
        </div>
      </div>

      {/* URL Info Card */}
      <div className="card mb-8">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {urlData.title || 'Untitled URL'}
            </h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Short URL:</span>
                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  /{urlData.customAlias || urlData.shortCode}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="text-gray-400 hover:text-gray-600"
                  title="Copy URL"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Destination:</span>
                <a
                  href={urlData.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 truncate max-w-md"
                >
                  {urlData.originalUrl}
                </a>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
              {urlData.description && (
                <p className="text-sm text-gray-600">{urlData.description}</p>
              )}
              {urlData.form && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Lead Generation Form
                  </span>
                  <span className="text-xs text-gray-500">Theme: {urlData.theme}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clicks</p>
              <p className="text-3xl font-bold text-blue-600">{analytics.totalClicks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <MousePointer className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-3xl font-bold text-green-600">{analytics.totalLeads}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.conversionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Activity
            </button>
            {analytics.submissions && analytics.submissions.length > 0 && (
              <button
                onClick={() => setActiveTab('responses')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'responses'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Responses ({analytics.submissions.length})
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Activity/Responses Content */}
      <div className="mb-8">
        {activeTab === 'activity' ? (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <span className="text-sm text-gray-500">Last 20 events</span>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
                analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getEventIcon(activity.eventType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {getEventLabel(activity.eventType)}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        {activity.browser && (
                          <span>{activity.browser}</span>
                        )}
                        {activity.device && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              {getDeviceIcon(activity.device)}
                              <span>{activity.device}</span>
                            </span>
                          </>
                        )}
                        {activity.country && (
                          <>
                            <span>•</span>
                            <span>{activity.country}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-xs text-gray-500">
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Globe className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Responses</h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {analytics.submissions?.length || 0} submissions
                </span>
                {analytics.submissions && analytics.submissions.length > 0 && (
                  <button
                    onClick={exportToCsv}
                    disabled={exportLoading}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    <span>{exportLoading ? 'Exporting...' : 'Export CSV'}</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {analytics.submissions && analytics.submissions.length > 0 ? (
                analytics.submissions.map((submission, index) => (
                  <div key={submission.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-green-100 rounded-full">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Submission #{submission.id.slice(-8)}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(submission.createdAt)}</span>
                            {submission.ipAddress && (
                              <>
                                <span>•</span>
                                <span>{submission.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(submission.data).map(([fieldId, value]) => (
                        <div key={fieldId} className="">
                          <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getFieldLabel(fieldId)}
                          </label>
                          <p className="text-sm text-gray-900 mt-1 p-2 bg-white rounded border">
                            {renderSubmissionValue(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No submissions yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Responses will appear here when users fill out your form
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Top Stats */}
        <div className="space-y-6">
          {/* Top Referrers */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
            <div className="space-y-3">
              {['Direct', 'Social Media', 'Search Engines', 'Email'].map((source, index) => {
                const count = Math.max(0, analytics.totalClicks - index * 2)
                const percentage = analytics.totalClicks > 0 
                  ? ((count / analytics.totalClicks) * 100).toFixed(1)
                  : 0
                return (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-900">{source}</span>
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

          {/* Export Data */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Download your form submissions for further analysis
            </p>
            <div className="space-y-2">
              <button
                onClick={exportToCsv}
                disabled={exportLoading || !analytics.submissions || analytics.submissions.length === 0}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>{exportLoading ? 'Exporting...' : 'Export Submissions as CSV'}</span>
              </button>
              {(!analytics.submissions || analytics.submissions.length === 0) && (
                <p className="text-xs text-gray-500 text-center">
                  {!urlData.form ? 'No form attached to this URL' : 'No submissions yet'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default URLAnalytics