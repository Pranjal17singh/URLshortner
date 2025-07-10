const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUrlCreation = [
  body('originalUrl')
    .isURL({ require_protocol: true })
    .withMessage('Please provide a valid URL with protocol (http/https)')
    .isLength({ max: 2048 })
    .withMessage('URL must be less than 2048 characters'),
  body('customCode')
    .optional()
    .trim()
    .custom((value) => {
      // Allow empty string (will be converted to null in route handler)
      if (value === '' || value === null || value === undefined) {
        return true;
      }
      // If provided, must be 4-20 characters and alphanumeric with hyphens/underscores
      if (value.length < 4 || value.length > 20) {
        throw new Error('Custom code must be 4-20 characters long');
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        throw new Error('Custom code can only contain letters, numbers, hyphens, and underscores');
      }
      return true;
    }),
  body('formId')
    .optional()
    .custom((value) => {
      // Allow empty string, null, or undefined
      if (value === '' || value === null || value === undefined) {
        return true;
      }
      // If provided, must be a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error('Form ID must be a valid UUID');
      }
      return true;
    }),
  body('theme')
    .optional()
    .isIn(['modern', 'dark', 'gradient', 'neon', 'forest'])
    .withMessage('Theme must be one of: modern, dark, gradient, neon, forest'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Title cannot exceed 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  handleValidationErrors
];

const validateFormCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Form name is required and cannot exceed 255 characters'),
  body('fields')
    .isArray({ min: 1 })
    .withMessage('Form must have at least one field'),
  body('fields.*.type')
    .isIn(['text', 'email', 'select', 'textarea', 'checkbox'])
    .withMessage('Invalid field type'),
  body('fields.*.label')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Field label is required and cannot exceed 255 characters'),
  body('fields.*.required')
    .isBoolean()
    .withMessage('Required field must be boolean'),
  handleValidationErrors
];

const validateShortCode = [
  param('shortCode')
    .trim()
    .isLength({ min: 4, max: 20 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid short code format'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateUrlCreation,
  validateFormCreation,
  validateShortCode,
  handleValidationErrors
};