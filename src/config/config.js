// config/config.js
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path"); // Agrega esta línea para usar la ruta

// Usa 'path.resolve' para asegurarte de que la ruta sea correcta
const envConfig = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname, "../../.env"))
);
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const config = {
  local: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
  },
  test: {
    username: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST_TEST,
    dialect: "mysql",
    logging: false,
  },
  production: {
    username: process.env.DB_USER_PRODUCTION,
    password: process.env.DB_PASSWORD_PRODUCTION,
    database: process.env.DB_NAME_PRODUCTION,
    host: process.env.DB_HOST_PRODUCTION,
    dialect: "mysql",
    logging: false,
  },
};

// Exportar el objeto completo
module.exports = config;
