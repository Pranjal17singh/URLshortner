const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Analytics = sequelize.define('Analytics', {
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
  eventType: {
    type: DataTypes.ENUM('click', 'form_view', 'form_submit', 'redirect'),
    allowNull: false
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
  },
  device: {
    type: DataTypes.STRING,
    allowNull: true
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  os: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['urlId']
    },
    {
      fields: ['eventType']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['ipAddress']
    },
    {
      fields: ['country']
    }
  ]
});

module.exports = Analytics;