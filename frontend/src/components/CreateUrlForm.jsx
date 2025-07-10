import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { nanoid } from 'nanoid'
import { ExternalLink, Plus } from 'lucide-react'

const CreateUrlForm = ({ onUrlCreated, onClose }) => {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    original_url: '',
    title: '',
    description: '',
    short_code: '',
    form_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [forms, setForms] = useState([])
  const [loadingForms, setLoadingForms] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadForms()
    }
  }, [user])

  const loadForms = async () => {
    try {
      setLoadingForms(true)
      const { data: formsData, error } = await supabase
        .from('forms')
        .select('id, name, template_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Load forms error:', error)
      } else {
        setForms(formsData || [])
      }
    } catch (error) {
      console.error('Load forms error:', error)
    } finally {
      setLoadingForms(false)
    }
  }

  const generateShortCode = () => {
    return nanoid(8)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) {
      toast.error('You must be logged in to create URLs')
      return
    }

    setLoading(true)
    try {
      // Generate short code if not provided
      const shortCode = formData.short_code || generateShortCode()

      // Validate URL
      try {
        new URL(formData.original_url)
      } catch {
        toast.error('Please enter a valid URL')
        setLoading(false)
        return
      }

      // Check if custom short code already exists
      if (formData.short_code) {
        const { data: existing } = await supabase
          .from('urls')
          .select('id')
          .eq('short_code', shortCode)
          .single()

        if (existing) {
          toast.error('This custom short code is already taken')
          setLoading(false)
          return
        }
      }

      // Create URL in database
      const urlData = {
        user_id: user.id,
        original_url: formData.original_url,
        short_code: shortCode,
        title: formData.title || null,
        description: formData.description || null,
        clicks: 0,
        is_active: true
      }

      // Add form_id if selected
      if (formData.form_id) {
        urlData.form_id = formData.form_id
      }

      const { data, error } = await supabase
        .from('urls')
        .insert([urlData])
        .select()
        .single()

      if (error) {
        console.error('URL creation error:', error)
        toast.error('Failed to create URL: ' + error.message)
        return
      }

      toast.success('Short URL created successfully!')
      
      // Reset form
      setFormData({
        original_url: '',
        title: '',
        description: '',
        short_code: '',
        form_id: ''
      })

      // Notify parent component
      if (onUrlCreated) {
        onUrlCreated(data)
      }

      // Close modal/form if callback provided
      if (onClose) {
        onClose()
      }

    } catch (error) {
      console.error('Create URL error:', error)
      toast.error('Failed to create URL')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Create Short URL</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Original URL *
          </label>
          <input
            type="url"
            name="original_url"
            value={formData.original_url}
            onChange={handleChange}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Short Code (optional)
          </label>
          <input
            type="text"
            name="short_code"
            value={formData.short_code}
            onChange={handleChange}
            placeholder="my-link"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            pattern="[a-zA-Z0-9-_]+"
            title="Only letters, numbers, hyphens, and underscores allowed"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to generate automatically
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title (optional)
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="My Awesome Link"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of this link"
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lead Generation Form (optional)
          </label>
          <div className="space-y-2">
            <select
              name="form_id"
              value={formData.form_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loadingForms}
            >
              <option value="">No form - Direct redirect</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>
                  {form.name} ({form.template_type || 'Custom'})
                </option>
              ))}
            </select>
            
            {loadingForms && (
              <p className="text-xs text-gray-500">Loading forms...</p>
            )}
            
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-gray-400" />
              <Link 
                to="/forms" 
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Create a new form
              </Link>
            </div>
            
            <p className="text-xs text-gray-500">
              {formData.form_id 
                ? "Users will fill out the form before being redirected" 
                : "Users will be redirected directly to the destination"
              }
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Short URL'}
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default CreateUrlForm