import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const { code } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Find the URL by short code
    const { data: url, error } = await supabase
      .from('urls')
      .select('*')
      .eq('short_code', code)
      .eq('is_active', true)
      .single()

    if (error || !url) {
      return res.status(404).json({ error: 'URL not found' })
    }

    // Check if URL is expired
    if (url.expires_at && new Date(url.expires_at) < new Date()) {
      return res.status(410).json({ error: 'URL has expired' })
    }

    // Record analytics
    const userAgent = req.headers['user-agent'] || 'Unknown'
    const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || 'Unknown'
    const referer = req.headers.referer || 'Direct'

    // Insert analytics record
    await supabase
      .from('analytics')
      .insert({
        url_id: url.id,
        user_agent: userAgent,
        ip_address: ip,
        referer: referer,
        clicked_at: new Date().toISOString()
      })

    // Increment click count
    await supabase
      .from('urls')
      .update({ clicks: url.clicks + 1 })
      .eq('id', url.id)

    // Check if URL has an associated form
    const { data: form } = await supabase
      .from('forms')
      .select('*')
      .eq('url_id', url.id)
      .eq('is_active', true)
      .single()

    if (form) {
      // Redirect to form submission page with URL info
      return res.redirect(302, `/submit/${url.short_code}`)
    }

    // Direct redirect to original URL
    return res.redirect(302, url.original_url)
  } catch (error) {
    console.error('Redirect error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}