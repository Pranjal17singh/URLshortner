import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getUser(req) {
  const authHeader = req.headers.authorization
  if (!authHeader) throw new Error('No authorization token')
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) throw new Error('Invalid token')
  return user
}

export default async function handler(req, res) {
  try {
    const user = await getUser(req)

    if (req.method === 'GET') {
      // Get all URLs for user
      const { data: urls, error } = await supabase
        .from('urls')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return res.json({ success: true, urls: urls || [] })
    }

    if (req.method === 'POST') {
      // Create new URL
      const { originalUrl, customCode, title, description, expiresAt } = req.body
      
      const shortCode = customCode || nanoid(8)
      
      // Check if custom code exists
      if (customCode) {
        const { data: existing } = await supabase
          .from('urls')
          .select('id')
          .eq('short_code', customCode)
          .single()
        
        if (existing) {
          return res.status(409).json({
            success: false,
            error: 'Custom code already exists'
          })
        }
      }
      
      const { data, error } = await supabase
        .from('urls')
        .insert({
          user_id: user.id,
          original_url: originalUrl,
          short_code: shortCode,
          title: title || null,
          description: description || null,
          expires_at: expiresAt || null,
          is_active: true,
          clicks: 0,
          leads: 0
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ success: false, error: 'Short code already exists' })
        }
        throw error
      }
      
      return res.status(201).json({
        success: true,
        message: 'URL created successfully',
        url: data
      })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('URLs API error:', error)
    if (error.message === 'No authorization token' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message })
    }
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}