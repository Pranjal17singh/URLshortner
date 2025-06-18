const { sequelize } = require('../config/database');
const User = require('./User');
const Form = require('./Form');
const URL = require('./URL');
const Submission = require('./Submission');
const Analytics = require('./Analytics');

User.hasMany(Form, { foreignKey: 'userId', as: 'forms' });
Form.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(URL, { foreignKey: 'userId', as: 'urls' });
URL.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Form.hasMany(URL, { foreignKey: 'formId', as: 'urls' });
URL.belongsTo(Form, { foreignKey: 'formId', as: 'form' });

URL.hasMany(Submission, { foreignKey: 'urlId', as: 'submissions' });
Submission.belongsTo(URL, { foreignKey: 'urlId', as: 'url' });

Form.hasMany(Submission, { foreignKey: 'formId', as: 'submissions' });
Submission.belongsTo(Form, { foreignKey: 'formId', as: 'form' });

URL.hasMany(Analytics, { foreignKey: 'urlId', as: 'analytics' });
Analytics.belongsTo(URL, { foreignKey: 'urlId', as: 'url' });

module.exports = {
  sequelize,
  User,
  Form,
  URL,
  Submission,
  Analytics
};