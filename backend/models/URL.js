const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { nanoid } = require('nanoid');

const URL = sequelize.define('URL', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  originalUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  shortCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => nanoid(6),
    validate: {
      len: [4, 20]
    }
  },
  customAlias: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      isValidAlias(value) {
        // Allow null/undefined values (optional field)
        if (value === null || value === undefined) {
          return;
        }
        // If provided, check length
        if (value.length < 3 || value.length > 50) {
          throw new Error('Custom alias must be between 3 and 50 characters');
        }
        // If provided, must be valid format
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          throw new Error('Custom alias can only contain letters, numbers, hyphens, and underscores');
        }
      }
    }
  },
  formId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Forms',
      key: 'id'
    }
  },
  theme: {
    type: DataTypes.ENUM('modern', 'dark', 'gradient', 'neon', 'forest'),
    defaultValue: 'modern'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  leads: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['shortCode'],
      unique: true
    },
    {
      fields: ['customAlias'],
      unique: true
    },
    {
      fields: ['userId']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = URL;