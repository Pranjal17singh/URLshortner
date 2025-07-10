import { createClient } from '@supabase/supabase-js'

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
    const { id } = req.query

    if (req.method === 'GET') {
      // Get specific URL
      const { data: url, error } = await supabase
        .from('urls')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      
      if (error || !url) {
        return res.status(404).json({ success: false, error: 'URL not found' })
      }
      
      return res.json({ success: true, url })
    }

    if (req.method === 'PUT') {
      // Update URL
      const { title, description, is_active } = req.body
      
      const { data, error } = await supabase
        .from('urls')
        .update({
          title,
          description,
          is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
      
      if (error) throw error
      if (!data) {
        return res.status(404).json({ success: false, error: 'URL not found' })
      }
      
      return res.json({
        success: true,
        message: 'URL updated successfully',
        url: data
      })
    }

    if (req.method === 'DELETE') {
      // Delete URL
      const { error } = await supabase
        .from('urls')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      
      if (error) throw error
      return res.json({ success: true, message: 'URL deleted successfully' })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('URL API error:', error)
    if (error.message === 'No authorization token' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message })
    }
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}