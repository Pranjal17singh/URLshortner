const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { validateUrlCreation, validateFormCreation } = require('../middleware/validation');
const { supabase } = require('../config/supabase');
const { nanoid } = require('nanoid');
const logger = require('../utils/logger');

const router = express.Router();

// ==============================================
// AUTH ROUTES
// ==============================================

router.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const userData = {
      id: req.user.id,
      email: req.user.email,
      firstName: profile?.first_name || req.user.user_metadata?.first_name || '',
      lastName: profile?.last_name || req.user.user_metadata?.last_name || ''
    };

    res.json({ success: true, user: userData });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user data' });
  }
});

router.put('/auth/profile', verifyToken, async (req, res) => {
  const { firstName, lastName } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: req.user.id,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: data.first_name,
        lastName: data.last_name
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// ==============================================
// URL ROUTES
// ==============================================

router.post('/urls', verifyToken, validateUrlCreation, async (req, res) => {
  const { originalUrl, customCode, title, description, expiresAt } = req.body;
  
  try {
    const shortCode = customCode || nanoid(8);
    
    if (customCode) {
      const { data: existing } = await supabase
        .from('urls')
        .select('id')
        .eq('short_code', customCode)
        .single();
      
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Custom code already exists'
        });
      }
    }
    
    const { data, error } = await supabase
      .from('urls')
      .insert({
        user_id: req.user.id,
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
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      message: 'URL created successfully',
      url: data
    });
  } catch (error) {
    logger.error('Create URL error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'Short code already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create URL' });
  }
});

router.get('/urls', verifyToken, async (req, res) => {
  try {
    const { data: urls, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, urls: urls || [] });
  } catch (error) {
    logger.error('Get URLs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get URLs' });
  }
});

router.get('/urls/:id', verifyToken, async (req, res) => {
  try {
    const { data: url, error } = await supabase
      .from('urls')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    
    if (error || !url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }
    
    res.json({ success: true, url });
  } catch (error) {
    logger.error('Get URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to get URL' });
  }
});

router.put('/urls/:id', verifyToken, async (req, res) => {
  const { title, description, is_active } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('urls')
      .update({
        title,
        description,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }
    
    res.json({
      success: true,
      message: 'URL updated successfully',
      url: data
    });
  } catch (error) {
    logger.error('Update URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to update URL' });
  }
});

router.delete('/urls/:id', verifyToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('urls')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) throw error;
    res.json({ success: true, message: 'URL deleted successfully' });
  } catch (error) {
    logger.error('Delete URL error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete URL' });
  }
});

// ==============================================
// FORM ROUTES
// ==============================================

router.get('/forms', verifyToken, async (req, res) => {
  try {
    const { data: forms, error } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, forms: forms || [] });
  } catch (error) {
    logger.error('Get forms error:', error);
    res.status(500).json({ success: false, error: 'Failed to get forms' });
  }
});

router.post('/forms', verifyToken, validateFormCreation, async (req, res) => {
  const { name, description, fields, template_type } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('forms')
      .insert({
        user_id: req.user.id,
        name,
        description: description || null,
        fields,
        template_type: template_type || null,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      form: data
    });
  } catch (error) {
    logger.error('Create form error:', error);
    res.status(500).json({ success: false, error: 'Failed to create form' });
  }
});

router.get('/forms/templates', (req, res) => {
  res.json({ 
    success: true,
    templates: [
      {
        id: 1,
        name: 'Contact Form',
        description: 'Basic contact information collection',
        fields: [
          { type: 'text', name: 'name', label: 'Full Name', required: true },
          { type: 'email', name: 'email', label: 'Email Address', required: true },
          { type: 'tel', name: 'phone', label: 'Phone Number', required: false },
          { type: 'textarea', name: 'message', label: 'Message', required: false }
        ]
      },
      {
        id: 2,
        name: 'Lead Generation',
        description: 'Comprehensive lead capture form',
        fields: [
          { type: 'text', name: 'firstName', label: 'First Name', required: true },
          { type: 'text', name: 'lastName', label: 'Last Name', required: true },
          { type: 'email', name: 'email', label: 'Business Email', required: true },
          { type: 'text', name: 'company', label: 'Company Name', required: true },
          { type: 'select', name: 'industry', label: 'Industry', required: true, options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Other'] },
          { type: 'tel', name: 'phone', label: 'Phone Number', required: false }
        ]
      }
    ]
  });
});

// ==============================================
// ANALYTICS ROUTES
// ==============================================

router.get('/analytics/dashboard', verifyToken, async (req, res) => {
  try {
    const { count: urlCount } = await supabase
      .from('urls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    const { data: urls } = await supabase
      .from('urls')
      .select('clicks')
      .eq('user_id', req.user.id);

    const totalClicks = urls?.reduce((sum, url) => sum + (url.clicks || 0), 0) || 0;

    const { count: leadsCount } = await supabase
      .from('form_submissions')
      .select('*', { count: 'exact', head: true })
      .in('form_id', 
        await supabase
          .from('forms')
          .select('id')
          .eq('user_id', req.user.id)
          .then(({ data }) => data?.map(f => f.id) || [])
      );

    const conversionRate = totalClicks > 0 ? ((leadsCount || 0) / totalClicks * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        totalUrls: urlCount || 0,
        totalClicks,
        totalLeads: leadsCount || 0,
        conversionRate: parseFloat(conversionRate)
      }
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard data' });
  }
});

router.get('/analytics/urls/:id', verifyToken, async (req, res) => {
  try {
    const { data: url, error: urlError } = await supabase
      .from('urls')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();
    
    if (urlError || !url) {
      return res.status(404).json({ success: false, error: 'URL not found' });
    }
    
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics')
      .select('*')
      .eq('url_id', req.params.id)
      .order('created_at', { ascending: false });
    
    if (analyticsError) throw analyticsError;
    
    res.json({
      success: true,
      url,
      analytics: analytics || []
    });
  } catch (error) {
    logger.error('Get URL analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get URL analytics' });
  }
});

module.exports = router;