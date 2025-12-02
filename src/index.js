const fs = require("fs");
const dotenv = require('dotenv');
const path = require('path');
const serverless = require('serverless-http'); // <--- NUEVO: Importamos el adaptador

const express = require("express");
const cors = require("cors");
const app = express();

// --- Carga de variables de entorno (Compatible con Lambda) ---
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath)); 
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }
} catch (error) {
  console.log("Nota: Iniciando sin archivo .env local (usando variables de sistema).");
}

const port = process.env.APP_PORT || 9000;

// --- Importación de Servicios y Rutas ---
const { startScheduler } = require('./services/schedulerService');
const mainRouter = require("./routes"); 

// --- INICIALIZACIONES GLOBALES ---
global.mockS3Files = [];

// --- Middlewares globales ---
app.use(express.json());
app.use(
  cors({
    // En producción, esto debería ser tu dominio real o '*' para el Demo
    origin: process.env.NODE_ENV === 'production' ? '*' : "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// --- Carga Dinámica de Rutas ---
app.use("/api", mainRouter); 

// --- LÓGICA DE ARRANQUE HÍBRIDA (Local vs Lambda) ---

if (process.env.NODE_ENV !== 'production') {
  // === MODO LOCAL ===
  app.listen(port, () => {
    console.log(`[Local Server] Running RAK Orion at port: ${port}`);
    // En local, iniciamos el cronjob aquí manualmente
    startScheduler();
    console.log("[Local Scheduler] Tareas programadas inicializadas.");
  });
} else {
  // === MODO LAMBDA (PRODUCCIÓN) ===
  // No hacemos app.listen. Exportamos la app envuelta para Lambda.
  // Nota: El scheduler NO se inicia aquí en Lambda, se configura en serverless.yml
  module.exports.handler = serverless(app);
}