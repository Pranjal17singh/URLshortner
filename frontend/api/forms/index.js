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

    if (req.method === 'GET') {
      // Get all forms for user
      const { data: forms, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return res.json({ success: true, forms: forms || [] })
    }

    if (req.method === 'POST') {
      // Create new form
      const { name, description, fields, template_type } = req.body
      
      const { data, error } = await supabase
        .from('forms')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          fields,
          template_type: template_type || null,
          is_active: true
        })
        .select()
        .single()
      
      if (error) throw error
      
      return res.status(201).json({
        success: true,
        message: 'Form created successfully',
        form: data
      })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Forms API error:', error)
    if (error.message === 'No authorization token' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message })
    }
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}