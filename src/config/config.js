// config/config.js
const dotenv = require('dotenv');
const fs = require('fs');

// Carga de variables de entorno al inicio.
// Esta línea es NECESARIA para que process.env.DB_USER tenga un valor.
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
 process.env[k] = envConfig[k];
}

const config = {
  local: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: true, // Lo activamos por defecto en desarrollo/local
    // Añadir el logger de consola por defecto.
    dialectOptions: { 
        decimalNumbers: true 
    }
  },
  test: {
    username: process.env.DB_USER_TEST || process.env.DB_USER, // Fallback a variables de local
    password: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST_TEST || process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.DB_USER_PRODUCTION,
    password: process.env.DB_PASSWORD_PRODUCTION,
    database: process.env.DB_NAME_PRODUCTION,
    host: process.env.DB_HOST_PRODUCTION,
    dialect: 'mysql',
    logging: false
  }
};

// Exportar el objeto completo
module.exports = config;