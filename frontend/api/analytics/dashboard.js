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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await getUser(req)

    // Get URL count
    const { count: urlCount } = await supabase
      .from('urls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get total clicks
    const { data: urls } = await supabase
      .from('urls')
      .select('clicks')
      .eq('user_id', user.id)

    const totalClicks = urls?.reduce((sum, url) => sum + (url.clicks || 0), 0) || 0

    // Get user's forms
    const { data: forms } = await supabase
      .from('forms')
      .select('id')
      .eq('user_id', user.id)

    const formIds = forms?.map(f => f.id) || []

    // Get leads count
    let leadsCount = 0
    if (formIds.length > 0) {
      const { count } = await supabase
        .from('form_submissions')
        .select('*', { count: 'exact', head: true })
        .in('form_id', formIds)
      leadsCount = count || 0
    }

    const conversionRate = totalClicks > 0 ? ((leadsCount || 0) / totalClicks * 100).toFixed(2) : 0

    res.json({
      success: true,
      data: {
        totalUrls: urlCount || 0,
        totalClicks,
        totalLeads: leadsCount || 0,
        conversionRate: parseFloat(conversionRate)
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    if (error.message === 'No authorization token' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message })
    }
    res.status(500).json({ success: false, error: 'Failed to get dashboard data' })
  }
}