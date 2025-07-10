// Clean Production-Ready URL Shortener API
const config = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeInput, securityHeaders, rateLimiters } = require('./middleware/security');
const { supabase } = require('./config/supabase');
const apiRoutes = require('./routes/index');
const logger = require('./utils/logger');

const app = express();

// ==============================================
// MIDDLEWARE SETUP
// ==============================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

app.use(securityHeaders);
app.use(cors({ 
  origin: config.NODE_ENV === 'production' ? config.FRONTEND_URL : true, 
  credentials: true 
}));

// Request processing
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);

// Rate limiting
app.use('/api/', rateLimiters.general);
app.use('/submit/', rateLimiters.submission);

// Handle Vercel routing
app.use((req, res, next) => {
  if (req.query.path) {
    req.url = '/' + req.query.path;
    req.path = '/' + req.query.path;
  }
  next();
});

// ==============================================
// HEALTH CHECK
// ==============================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: '1.0.0'
  });
});

// ==============================================
// API ROUTES
// ==============================================

app.use('/api', apiRoutes);

// ==============================================
// URL REDIRECT HANDLER
// ==============================================

app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    if (!/^[a-zA-Z0-9_-]{4,20}$/.test(shortCode)) {
      return res.status(404).json({ 
        success: false,
        error: 'Invalid short code format' 
      });
    }
    
    const { data: url, error } = await supabase
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
      .eq('short_code', shortCode)
      .eq('is_active', true)
      .single();
    
    if (error || !url) {
      return res.status(404).send(generateErrorPage('Link Not Found', 'The short link you\'re looking for doesn\'t exist or has been disabled.'));
    }
    
    if (url.expires_at && new Date() > new Date(url.expires_at)) {
      return res.status(410).send(generateErrorPage('Link Expired', 'This short link has expired and is no longer available.'));
    }
    
    // Track analytics
    try {
      await supabase.from('analytics').insert({
        url_id: url.id,
        event_type: 'click',
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('User-Agent'),
        referrer: req.get('Referer')
      });
      
      await supabase
        .from('urls')
        .update({ clicks: (url.clicks || 0) + 1 })
        .eq('id', url.id);
    } catch (analyticsError) {
      logger.error('Analytics tracking error:', analyticsError);
    }
    
    if (!url.forms || !url.forms.fields) {
      await supabase.from('analytics').insert({
        url_id: url.id,
        event_type: 'redirect',
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('User-Agent'),
        referrer: req.get('Referer')
      });
      return res.redirect(url.original_url);
    }
    
    const formHtml = generateFormHtml(url, url.forms, shortCode);
    res.send(formHtml);
    
  } catch (error) {
    logger.error('Redirect error:', error);
    res.status(500).send(generateErrorPage('Something went wrong', 'Please try again later.'));
  }
});

// ==============================================
// FORM SUBMISSION HANDLER
// ==============================================

app.post('/submit/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const submissionData = req.body;
    
    const { data: url, error } = await supabase
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
      .eq('short_code', shortCode)
      .eq('is_active', true)
      .single();
    
    if (error || !url || !url.forms) {
      return res.status(404).json({ 
        success: false, 
        error: 'Form not found' 
      });
    }
    
    // Validate required fields
    const requiredFields = url.forms.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => 
      !submissionData[field.name] || submissionData[field.name].trim() === ''
    );
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields.map(field => field.label)
      });
    }
    
    // Save submission
    await supabase.from('form_submissions').insert({
      url_id: url.id,
      form_id: url.forms.id,
      submission_data: submissionData,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.get('User-Agent'),
      referrer: req.get('Referer')
    });
    
    // Track analytics
    await supabase.from('analytics').insert([
      {
        url_id: url.id,
        event_type: 'form_submit',
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('User-Agent'),
        referrer: req.get('Referer')
      },
      {
        url_id: url.id,
        event_type: 'redirect',
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.get('User-Agent'),
        referrer: req.get('Referer')
      }
    ]);
    
    // Increment leads count
    await supabase
      .from('urls')
      .update({ leads: (url.leads || 0) + 1 })
      .eq('id', url.id);
    
    const isAjax = req.headers['content-type'] && req.headers['content-type'].includes('application/json');
    
    if (isAjax) {
      res.json({ success: true, redirectUrl: url.original_url });
    } else {
      res.redirect(url.original_url);
    }
    
  } catch (error) {
    logger.error('Form submission error:', error);
    res.status(500).json({ success: false, error: 'Submission failed' });
  }
});

// ==============================================
// ROOT ENDPOINT
// ==============================================

app.get('/', (req, res) => {
  res.json({
    message: 'URL Shortener API',
    status: 'OK',
    version: '1.0.0',
    environment: config.NODE_ENV,
    endpoints: {
      health: '/health',
      api: '/api/',
      docs: 'https://github.com/your-repo/docs'
    }
  });
});

// ==============================================
// ERROR HANDLING
// ==============================================

app.use(notFoundHandler);
app.use(globalErrorHandler);

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

function generateErrorPage(title, message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #e74c3c; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p>${message}</p>
    </body>
    </html>
  `;
}

function generateFormHtml(url, form, shortCode) {
  const formFields = form.fields.map(field => {
    const required = field.required ? 'required' : '';
    const requiredStar = field.required ? '<span class="required">*</span>' : '';
    
    let fieldHtml = '';
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        fieldHtml = `
          <div class="form-field">
            <label class="form-label" for="${field.name}">
              ${field.label}${requiredStar}
            </label>
            <input
              type="${field.type}"
              id="${field.name}"
              name="${field.name}"
              class="form-input"
              placeholder="${field.placeholder || ''}"
              ${required}
            />
          </div>
        `;
        break;
        
      case 'textarea':
        fieldHtml = `
          <div class="form-field">
            <label class="form-label" for="${field.name}">
              ${field.label}${requiredStar}
            </label>
            <textarea
              id="${field.name}"
              name="${field.name}"
              class="form-textarea"
              placeholder="${field.placeholder || ''}"
              ${required}
            ></textarea>
          </div>
        `;
        break;
        
      case 'select':
        const options = field.options?.map(option => 
          `<option value="${option}">${option}</option>`
        ).join('') || '';
        fieldHtml = `
          <div class="form-field">
            <label class="form-label" for="${field.name}">
              ${field.label}${requiredStar}
            </label>
            <select
              id="${field.name}"
              name="${field.name}"
              class="form-select"
              ${required}
            >
              <option value="">Select an option</option>
              ${options}
            </select>
          </div>
        `;
        break;
        
      case 'checkbox':
        fieldHtml = `
          <div class="form-field">
            <div class="form-checkbox">
              <input
                type="checkbox"
                id="${field.name}"
                name="${field.name}"
                value="true"
                ${required}
              />
              <label class="form-label" for="${field.name}">
                ${field.label}${requiredStar}
              </label>
            </div>
          </div>
        `;
        break;
    }
    
    return fieldHtml;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${url.title || 'Complete the form to continue'}</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .form-container { max-width: 500px; margin: 0 auto; }
        .form-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-title { margin: 0 0 20px 0; color: #333; }
        .form-description { color: #666; margin-bottom: 30px; }
        .form-field { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 5px; font-weight: bold; color: #333; }
        .form-input, .form-textarea, .form-select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; box-sizing: border-box; }
        .form-textarea { height: 80px; resize: vertical; }
        .form-checkbox { display: flex; align-items: center; gap: 10px; }
        .form-submit { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
        .form-submit:hover { background: #0056b3; }
        .form-submit:disabled { background: #ccc; cursor: not-allowed; }
        .required { color: red; }
      </style>
    </head>
    <body>
      <div class="form-container">
        <div class="form-card">
          <h1 class="form-title">${url.title || 'Complete the form to continue'}</h1>
          ${url.description ? `<p class="form-description">${url.description}</p>` : ''}
          
          <form id="leadForm" method="POST" action="/submit/${shortCode}">
            ${formFields}
            
            <button type="submit" class="form-submit">
              Continue to Destination
            </button>
          </form>
        </div>
      </div>
      
      <script>
        document.getElementById('leadForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const button = document.querySelector('.form-submit');
          const originalText = button.textContent;
          button.textContent = 'Submitting...';
          button.disabled = true;
          
          const formData = new FormData(this);
          const data = {};
          
          for (let [key, value] of formData.entries()) {
            data[key] = value;
          }
          
          fetch(this.action, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          })
          .then(response => response.json())
          .then(result => {
            if (result.success && result.redirectUrl) {
              button.textContent = 'Redirecting...';
              window.location.href = result.redirectUrl;
            } else {
              throw new Error(result.error || 'Form submission failed');
            }
          })
          .catch(error => {
            button.textContent = originalText;
            button.disabled = false;
            this.submit();
          });
        });
      </script>
    </body>
    </html>
  `;
}

// ==============================================
// SERVER STARTUP
// ==============================================

if (require.main === module) {
  const PORT = config.PORT || 3001;
  
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Environment: ${config.NODE_ENV}`);
    logger.info(`🔗 Health: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down gracefully...');
    server.close(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down gracefully...');
    server.close(() => process.exit(0));
  });
}

module.exports = app;