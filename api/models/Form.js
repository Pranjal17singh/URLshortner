const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Form = sequelize.define('Form', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  fields: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  isTemplate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  templateType: {
    type: DataTypes.ENUM('contact', 'newsletter', 'demo', 'custom'),
    defaultValue: 'custom'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isTemplate']
    }
  ]
});

module.exports = Form;