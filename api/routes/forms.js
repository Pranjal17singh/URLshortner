const express = require('express');
const { Form, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validateFormCreation } = require('../middleware/validation');
const { Op } = require('sequelize');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { includeTemplates = false } = req.query;
    
    const whereClause = includeTemplates 
      ? { [Op.or]: [{ userId: req.user.id }, { isTemplate: true }] }
      : { userId: req.user.id };

    const forms = await Form.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'contact-template',
        name: 'Contact Form',
        templateType: 'contact',
        isTemplate: true,
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'Enter your email'
          },
          {
            id: 'company',
            type: 'text',
            label: 'Company',
            required: false,
            placeholder: 'Your company name'
          },
          {
            id: 'message',
            type: 'textarea',
            label: 'Message',
            required: true,
            placeholder: 'How can we help you?'
          }
        ]
      },
      {
        id: 'newsletter-template',
        name: 'Newsletter Signup',
        templateType: 'newsletter',
        isTemplate: true,
        fields: [
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'Enter your email to subscribe'
          },
          {
            id: 'name',
            type: 'text',
            label: 'First Name',
            required: false,
            placeholder: 'Your first name (optional)'
          },
          {
            id: 'interests',
            type: 'select',
            label: 'Interests',
            required: false,
            options: [
              { value: 'tech', label: 'Technology' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'design', label: 'Design' },
              { value: 'business', label: 'Business' }
            ]
          }
        ]
      },
      {
        id: 'demo-template',
        name: 'Demo Request',
        templateType: 'demo',
        isTemplate: true,
        fields: [
          {
            id: 'name',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Work Email',
            required: true,
            placeholder: 'Enter your work email'
          },
          {
            id: 'company',
            type: 'text',
            label: 'Company Name',
            required: true,
            placeholder: 'Your company name'
          },
          {
            id: 'role',
            type: 'select',
            label: 'Job Role',
            required: true,
            options: [
              { value: 'ceo', label: 'CEO/Founder' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'sales', label: 'Sales' },
              { value: 'product', label: 'Product' },
              { value: 'other', label: 'Other' }
            ]
          },
          {
            id: 'company_size',
            type: 'select',
            label: 'Company Size',
            required: true,
            options: [
              { value: '1-10', label: '1-10 employees' },
              { value: '11-50', label: '11-50 employees' },
              { value: '51-200', label: '51-200 employees' },
              { value: '201-1000', label: '201-1000 employees' },
              { value: '1000+', label: '1000+ employees' }
            ]
          }
        ]
      }
    ];

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.post('/', authenticate, validateFormCreation, async (req, res) => {
  try {
    const { name, fields, templateType } = req.body;

    const form = await Form.create({
      userId: req.user.id,
      name,
      fields,
      templateType: templateType || 'custom'
    });

    res.status(201).json({
      message: 'Form created successfully',
      form
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const form = await Form.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

router.put('/:id', authenticate, validateFormCreation, async (req, res) => {
  try {
    const { name, fields, isActive } = req.body;

    const form = await Form.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    await form.update({
      name: name || form.name,
      fields: fields || form.fields,
      isActive: isActive !== undefined ? isActive : form.isActive
    });

    res.json({
      message: 'Form updated successfully',
      form
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const form = await Form.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    await form.destroy();

    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

module.exports = router;