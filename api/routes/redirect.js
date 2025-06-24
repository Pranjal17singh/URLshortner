const express = require('express');
const { URL, Form, Submission, Analytics } = require('../models');
const { validateShortCode } = require('../middleware/validation');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const trackAnalytics = async (urlId, eventType, req, metadata = {}) => {
  try {
    await Analytics.create({
      urlId,
      eventType,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer'),
      metadata
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
};

const getFormHtml = (url, form, theme = 'modern', shortCode) => {
  const themesCSS = fs.readFileSync(path.join(__dirname, '../../shared/themes.css'), 'utf8');
  
  const formFields = form.fields.map(field => {
    let fieldHtml = '';
    const required = field.required ? 'required' : '';
    const requiredStar = field.required ? '<span class="required">*</span>' : '';
    
    switch (field.type) {
      case 'text':
      case 'email':
        fieldHtml = `
          <div class="form-field">
            <label class="form-label" for="${field.id}">
              ${field.label}${requiredStar}
            </label>
            <input
              type="${field.type}"
              id="${field.id}"
              name="${field.id}"
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
            <label class="form-label" for="${field.id}">
              ${field.label}${requiredStar}
            </label>
            <textarea
              id="${field.id}"
              name="${field.id}"
              class="form-textarea"
              placeholder="${field.placeholder || ''}"
              ${required}
            ></textarea>
          </div>
        `;
        break;
        
      case 'select':
        const options = field.options.map(option => 
          `<option value="${option.value}">${option.label}</option>`
        ).join('');
        fieldHtml = `
          <div class="form-field">
            <label class="form-label" for="${field.id}">
              ${field.label}${requiredStar}
            </label>
            <select
              id="${field.id}"
              name="${field.id}"
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
                id="${field.id}"
                name="${field.id}"
                value="true"
                ${required}
              />
              <label class="form-label" for="${field.id}">
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
      <style>${themesCSS}</style>
    </head>
    <body class="theme-${theme}">
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
          // Try AJAX first, fall back to traditional form submission
          e.preventDefault();
          
          const button = document.querySelector('.form-submit');
          button.textContent = 'Submitting...';
          button.disabled = true;
          
          const formData = new FormData(this);
          const data = {};
          
          for (let [key, value] of formData.entries()) {
            data[key] = value;
          }
          
          fetch(this.action, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(result => {
            if (result.success && result.redirectUrl) {
              button.textContent = 'Redirecting...';
              window.location.href = result.redirectUrl;
            } else {
              throw new Error(result.error || 'Form submission failed');
            }
          })
          .catch(error => {
            console.log('AJAX failed, trying traditional form submission:', error);
            // Fall back to traditional form submission
            button.textContent = 'Continue to Destination';
            button.disabled = false;
            this.submit();
          });
        });
        
        // Track form view
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            urlId: '${url.id}',
            eventType: 'form_view'
          })
        });
      </script>
    </body>
    </html>
  `;
};

router.get('/:shortCode', validateShortCode, async (req, res) => {
  try {
    // Set relaxed CSP for form pages
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "form-action 'self' *; " +
      "connect-src 'self' *"
    );
    
    const { shortCode } = req.params;
    
    const url = await URL.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { shortCode },
          { customAlias: shortCode }
        ],
        isActive: true
      },
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'fields', 'templateType']
        }
      ]
    });

    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>404 - Link Not Found</h1>
          <p>The short link you're looking for doesn't exist or has been disabled.</p>
        </body>
        </html>
      `);
    }

    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Expired</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #f39c12; }
          </style>
        </head>
        <body>
          <h1>Link Expired</h1>
          <p>This short link has expired and is no longer available.</p>
        </body>
        </html>
      `);
    }

    await trackAnalytics(url.id, 'click', req);
    
    await url.increment('clicks');

    if (!url.form) {
      await trackAnalytics(url.id, 'redirect', req);
      return res.redirect(url.originalUrl);
    }

    const formHtml = getFormHtml(url, url.form, url.theme, shortCode);
    res.send(formHtml);
    
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Something went wrong</h1>
        <p>Please try again later.</p>
      </body>
      </html>
    `);
  }
});

router.post('/submit/:shortCode', validateShortCode, async (req, res) => {
  try {
    // Set relaxed CSP for form submission responses
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "form-action 'self' *; " +
      "connect-src 'self' *"
    );
    
    const { shortCode } = req.params;
    const submissionData = req.body;

    const url = await URL.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { shortCode },
          { customAlias: shortCode }
        ],
        isActive: true
      },
      include: [
        {
          model: Form,
          as: 'form'
        }
      ]
    });

    if (!url || !url.form) {
      return res.status(404).json({ 
        success: false, 
        error: 'Form not found' 
      });
    }

    const requiredFields = url.form.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => 
      !submissionData[field.id] || submissionData[field.id].trim() === ''
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields.map(field => field.label)
      });
    }

    await Submission.create({
      urlId: url.id,
      formId: url.form.id,
      submissionData,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referrer: req.get('Referer')
    });

    await trackAnalytics(url.id, 'form_submit', req, { submissionData });
    await trackAnalytics(url.id, 'redirect', req);
    
    await url.increment('leads');

    // Check if this is an AJAX request or traditional form submission
    const isAjax = req.headers['content-type'] && req.headers['content-type'].includes('application/json');
    
    if (isAjax) {
      res.json({
        success: true,
        redirectUrl: url.originalUrl
      });
    } else {
      // Traditional form submission - redirect directly
      res.redirect(url.originalUrl);
    }

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Submission failed'
    });
  }
});

module.exports = router;