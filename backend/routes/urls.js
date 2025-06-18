const express = require('express');
const { URL, Form, Analytics, Submission } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateUrlCreation } = require('../middleware/validation');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (search) {
      whereClause[Op.or] = [
        { originalUrl: { [Op.iLike]: `%${search}%` } },
        { shortCode: { [Op.iLike]: `%${search}%` } },
        { customAlias: { [Op.iLike]: `%${search}%` } },
        { title: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: urls } = await URL.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'templateType']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      urls,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get URLs error:', error);
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

router.post('/', authenticate, validateUrlCreation, async (req, res) => {
  try {
    const { originalUrl, customAlias, formId, theme, title, description, expiresAt } = req.body;

    // If customAlias is provided and not empty, check if it exists
    let finalCustomAlias = customAlias && customAlias.trim() !== '' ? customAlias.trim() : null;
    
    if (finalCustomAlias) {
      const existingAlias = await URL.findOne({ where: { customAlias: finalCustomAlias } });
      if (existingAlias) {
        return res.status(409).json({ error: 'Custom alias already exists' });
      }
    }

    if (formId) {
      const form = await Form.findOne({
        where: { id: formId, userId: req.user.id }
      });
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
    }

    const url = await URL.create({
      userId: req.user.id,
      originalUrl,
      customAlias: finalCustomAlias,
      formId,
      theme: theme || 'modern',
      title,
      description,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    });

    const urlWithForm = await URL.findByPk(url.id, {
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'templateType']
        }
      ]
    });

    res.status(201).json({
      message: 'URL created successfully',
      url: urlWithForm,
      shortUrl: `${process.env.BASE_URL}/${urlWithForm.customAlias || urlWithForm.shortCode}`
    });
  } catch (error) {
    console.error('Create URL error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create URL',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const url = await URL.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'fields', 'templateType']
        }
      ]
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ url });
  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({ error: 'Failed to fetch URL' });
  }
});

router.put('/:id', authenticate, validateUrlCreation, async (req, res) => {
  try {
    const { originalUrl, customAlias, formId, theme, title, description, isActive, expiresAt } = req.body;

    const url = await URL.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // Handle custom alias updates
    let finalCustomAliasUpdate = customAlias && customAlias.trim() !== '' ? customAlias.trim() : null;
    
    if (finalCustomAliasUpdate && finalCustomAliasUpdate !== url.customAlias) {
      const existingAlias = await URL.findOne({ where: { customAlias: finalCustomAliasUpdate } });
      if (existingAlias) {
        return res.status(409).json({ error: 'Custom alias already exists' });
      }
    }

    if (formId) {
      const form = await Form.findOne({
        where: { id: formId, userId: req.user.id }
      });
      if (!form) {
        return res.status(404).json({ error: 'Form not found' });
      }
    }

    await url.update({
      originalUrl: originalUrl || url.originalUrl,
      customAlias: customAlias !== undefined ? finalCustomAliasUpdate : url.customAlias,
      formId: formId !== undefined ? formId : url.formId,
      theme: theme || url.theme,
      title: title !== undefined ? title : url.title,
      description: description !== undefined ? description : url.description,
      isActive: isActive !== undefined ? isActive : url.isActive,
      expiresAt: expiresAt ? new Date(expiresAt) : url.expiresAt
    });

    const updatedUrl = await URL.findByPk(url.id, {
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'templateType']
        }
      ]
    });

    res.json({
      message: 'URL updated successfully',
      url: updatedUrl
    });
  } catch (error) {
    console.error('Update URL error:', error);
    res.status(500).json({ error: 'Failed to update URL' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const url = await URL.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    await url.destroy();

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({ error: 'Failed to delete URL' });
  }
});

router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const url = await URL.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'fields']
        }
      ]
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const [analytics, submissions] = await Promise.all([
      Analytics.findAll({
        where: { urlId: url.id },
        attributes: ['eventType', 'createdAt', 'country', 'device', 'browser', 'ipAddress', 'userAgent'],
        order: [['createdAt', 'DESC']],
        limit: 100
      }),
      
      url.form ? Submission.findAll({
        where: { urlId: url.id },
        attributes: ['id', 'submissionData', 'createdAt', 'ipAddress', 'userAgent'],
        order: [['createdAt', 'DESC']],
        limit: 50
      }) : []
    ]);

    const stats = {
      totalClicks: url.clicks,
      totalLeads: url.leads,
      conversionRate: url.clicks > 0 ? ((url.leads / url.clicks) * 100).toFixed(2) : 0,
      recentActivity: analytics,
      submissions: submissions.map(sub => ({
        id: sub.id,
        data: sub.submissionData,
        createdAt: sub.createdAt,
        ipAddress: sub.ipAddress,
        userAgent: sub.userAgent
      })),
      formFields: url.form ? url.form.fields : []
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get URL stats error:', error);
    res.status(500).json({ error: 'Failed to fetch URL statistics' });
  }
});

router.get('/:id/export', authenticate, async (req, res) => {
  try {
    const url = await URL.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [
        {
          model: Form,
          as: 'form',
          attributes: ['id', 'name', 'fields']
        }
      ]
    });

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    if (!url.form) {
      return res.status(400).json({ error: 'No form attached to this URL' });
    }

    const submissions = await Submission.findAll({
      where: { urlId: url.id },
      order: [['createdAt', 'DESC']]
    });

    if (submissions.length === 0) {
      return res.status(404).json({ error: 'No submissions found' });
    }

    // Get all unique field names from form fields and submission data
    const formFieldNames = url.form.fields.map(field => field.id);
    const allFieldNames = new Set([...formFieldNames]);
    
    // Add any additional fields found in submissions
    submissions.forEach(sub => {
      Object.keys(sub.submissionData).forEach(key => {
        allFieldNames.add(key);
      });
    });

    // Create CSV headers
    const headers = [
      'Submission ID',
      'Submitted At',
      'IP Address',
      ...Array.from(allFieldNames).map(fieldId => {
        const formField = url.form.fields.find(f => f.id === fieldId);
        return formField ? formField.label : fieldId;
      })
    ];

    // Create CSV rows
    const rows = submissions.map(sub => [
      sub.id,
      new Date(sub.createdAt).toLocaleString(),
      sub.ipAddress || 'Unknown',
      ...Array.from(allFieldNames).map(fieldId => {
        const value = sub.submissionData[fieldId];
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains commas, quotes, or newlines
          return value.includes(',') || value.includes('"') || value.includes('\n') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }
        return value || '';
      })
    ]);

    // Generate CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Set response headers for file download
    const filename = `${url.customAlias || url.shortCode}_submissions_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export submissions' });
  }
});

module.exports = router;