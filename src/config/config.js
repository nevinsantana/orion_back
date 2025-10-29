const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path'); // <-- AGREGADO: Necesario para rutas absolutas

// --- Corrección de Lectura de .env ---
// Buscamos el .env UN NIVEL ARRIBA de donde se está ejecutando el config.js.
// El path.resolve encuentra la ruta absoluta del .env sin depender de dónde se ejecuta el comando.
try {
    const envPath = path.resolve(__dirname, '../../.env');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (error) {
    // Es común que la CLI de Sequelize falle al inicio de la carga,
    // por eso lo encerramos en un try/catch para evitar que el programa se detenga
    console.error('Advertencia: No se pudo cargar el archivo .env. Asegúrate de que exista en la raíz del proyecto.', error.message);
}
// ----------------------------------------

const config = {
  local: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3305, 
    dialect: 'mysql', // La clave para Sequelize
    logging: console.log, 
    dialectOptions: { 
        decimalNumbers: true 
    }
  },
  test: {
    username: process.env.DB_USER_TEST || process.env.DB_USER,
    password: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST_TEST || process.env.DB_HOST,
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
