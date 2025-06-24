const { Sequelize } = require('sequelize');

// Use PostgreSQL via Supabase as primary database
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  native: false, // Disable native bindings
  define: {
    timestamps: true
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Supabase PostgreSQL database connected successfully');
    
    // Sync database schema (creates tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('Database schema synced');
  } catch (error) {
    console.error('Unable to connect to Supabase database:', error);
    console.error('Make sure DATABASE_URL environment variable is set');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };