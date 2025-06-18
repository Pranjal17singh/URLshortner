const { Sequelize } = require('sequelize');

// Use PostgreSQL for production (Supabase) or SQLite for development
const sequelize = process.env.DATABASE_URL ? 
  new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }) :
  new Sequelize({
    dialect: 'sqlite',
    storage: process.env.NODE_ENV === 'production' ? 'database.sqlite' : 'database_dev.sqlite',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      console.log('Database synced');
    }
  } catch (error) {
    console.error('Unable to connect to database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };