const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  urlId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'URLs',
      key: 'id'
    }
  },
  formId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Forms',
      key: 'id'
    }
  },
  submissionData: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['urlId']
    },
    {
      fields: ['formId']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['ipAddress']
    }
  ]
});

module.exports = Submission;