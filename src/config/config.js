const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// --- Carga de .env (Igual que tenías) ---
try {
    const envPath = path.resolve(__dirname, '../../.env');
    // Solo intentamos leer el archivo si existe (para que no falle en Lambda donde no subiremos el .env)
    if (fs.existsSync(envPath)) {
        const envConfig = dotenv.parse(fs.readFileSync(envPath));
        for (const k in envConfig) {
            process.env[k] = envConfig[k];
        }
    }
} catch (error) {
    console.error('Nota: No se cargó .env local (normal en Producción/AWS si usas variables de entorno)', error.message);
}
// ----------------------------------------

const config = {
  local: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3305, 
    dialect: 'mysql',
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
  // --- AQUÍ ESTÁ EL CAMBIO CLAVE PARA AWS ---
  production: {
    // Nota: Asegúrate de que en AWS Lambda definamos estas variables de entorno (DB_USER, etc)
    // He simplificado las variables para usar las estándar, pero puedes usar _PRODUCTION si prefieres.
    username: process.env.DB_USER || process.env.DB_USER_PRODUCTION, 
    password: process.env.DB_PASSWORD || process.env.DB_PASSWORD_PRODUCTION,
    database: process.env.DB_NAME || process.env.DB_NAME_PRODUCTION,
    host: process.env.DB_HOST || process.env.DB_HOST_PRODUCTION,
    dialect: "mysql",
    logging: false, // Apagamos logs para ahorrar costos en CloudWatch
    
    // Configuración para que Lambda no rompa la BD
    pool: {
      max: 2,      // Máximo 2 conexiones por instancia de Lambda
      min: 0,      // Mínimo 0 para permitir desconexión total
      idle: 0,     // Cerrar inmediatamente si no se usa
      acquire: 3000, // Timeout de 3s si no logra conectar
      evict: 1000  // Limpiar conexiones viejas cada segundo
    },
    
    dialectOptions: {
      // Importante: Mantener coherencia con local para cálculos de dinero
      decimalNumbers: true, 
      // Obligatorio para RDS Aurora
      ssl: {
        require: true,
        rejectUnauthorized: false // Acepta el certificado de AWS sin validación estricta de CA
      }
    }
  },
};

module.exports = config;