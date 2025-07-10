import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import CreateUrlForm from '../components/CreateUrlForm'
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  Trash2, 
  BarChart3, 
  Eye, 
  Users, 
  TrendingUp,
  Link as LinkIcon
} from 'lucide-react'
import toast from 'react-hot-toast'
import copy from 'copy-to-clipboard'

const Dashboard = () => {
  const { user } = useAuth()
  const [urls, setUrls] = useState([])
  const [stats, setStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
    totalLeads: 0,
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    try {
      console.log('Loading dashboard data for user:', user?.id)
      
      // Get URLs from Supabase
      const { data: urlsData, error: urlsError } = await supabase
        .from('urls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (urlsError) {
        console.error('URLs fetch error:', urlsError)
        // If table doesn't exist, show empty state
        setUrls([])
      } else {
        setUrls(urlsData || [])
      }

      // Calculate stats from URLs data
      const totalUrls = urlsData?.length || 0
      const totalClicks = urlsData?.reduce((sum, url) => sum + (url.clicks || 0), 0) || 0
      
      // Get form submissions count if forms table exists
      let totalLeads = 0
      try {
        const { count } = await supabase
          .from('form_submissions')
          .select('*', { count: 'exact', head: true })
          .in('form_id', 
            await supabase
              .from('forms')
              .select('id')
              .eq('user_id', user.id)
              .then(({ data }) => data?.map(f => f.id) || [])
          )
        totalLeads = count || 0
      } catch (error) {
        console.log('Forms/submissions tables not yet created')
      }

      const conversionRate = totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(2) : 0

      setStats({
        totalUrls,
        totalClicks,
        totalLeads,
        conversionRate: parseFloat(conversionRate)
      })

    } catch (error) {
      console.error('Dashboard load error:', error)
      toast.error('Failed to load dashboard data')
      // Set empty state on error
      setUrls([])
      setStats({ totalUrls: 0, totalClicks: 0, totalLeads: 0, conversionRate: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleUrlCreated = (newUrl) => {
    setUrls([newUrl, ...urls])
    setStats(prev => ({
      ...prev,
      totalUrls: prev.totalUrls + 1
    }))
    setShowCreateForm(false)
  }

  const copyToClipboard = (url) => {
    const shortUrl = `${window.location.origin}/${url.short_code}`
    copy(shortUrl)
    toast.success('Short URL copied to clipboard!')
  }

  const deleteUrl = async (id) => {
    if (!confirm('Are you sure you want to delete this URL?')) return
    
    try {
      const { error } = await supabase
        .from('urls')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only delete their own URLs

      if (error) {
        throw error
      }

      setUrls(urls.filter(url => url.id !== id))
      toast.success('URL deleted successfully')
      
      // Update stats
      const newStats = { ...stats }
      newStats.totalUrls -= 1
      const deletedUrl = urls.find(url => url.id === id)
      if (deletedUrl?.clicks) {
        newStats.totalClicks -= deletedUrl.clicks
      }
      setStats(newStats)
      
    } catch (error) {
      console.error('Delete URL error:', error)
      toast.error('Failed to delete URL')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Manage your short URLs and track performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <LinkIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total URLs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUrls}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClicks}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Your URLs</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Short URL</span>
        </button>
      </div>

      {/* URLs List */}
      {urls.length === 0 ? (
        <div className="card text-center py-12">
          <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No URLs yet</h3>
          <p className="text-gray-600 mb-4">Create your first short URL to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            Create Short URL
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {urls.map((url) => (
                  <tr key={url.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {url.title || 'Untitled'}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {url.original_url}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-blue-600 font-mono">
                        {url.short_code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {url.clicks || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(url.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(url)}
                          className="text-blue-400 hover:text-blue-600"
                          title="Copy short URL"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={url.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                          title="Visit original URL"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <Link
                          to={`/url/${url.id}`}
                          className="text-gray-400 hover:text-gray-600"
                          title="View analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => deleteUrl(url.id)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete URL"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create URL Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full">
            <CreateUrlForm 
              onUrlCreated={handleUrlCreated}
              onClose={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard