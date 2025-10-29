const fs = require("fs");
const dotenv = require('dotenv');
const path = require('path');

// --- Carga de variables de entorno ---
// Usamos path.resolve para asegurar que encuentre .env desde la raíz
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env'))); 
for (const k in envConfig) {
 process.env[k] = envConfig[k];
}

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 9000;

// --- Importación de Servicios y Rutas ---
const { startScheduler } = require('./services/schedulerService');
const mainRouter = require("./routes"); // Importa el índice dinámico

// --- INICIALIZACIONES GLOBALES ---
// Inicialización del mock S3 para Reportes XLS (solo para testing local)
global.mockS3Files = [];

// --- Middlewares globales ---
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// --- Carga Dinámica de Rutas ---
// La carga dinámica (mainRouter) maneja /api/[nombre_archivo]
app.use("/api", mainRouter); 

// --- Ejecución del Servidor ---
app.listen(port, () => {
  console.log(`[Server] Running RAK Orion at port: ${port}`);
  
  // 1. Activación del Scheduler
  startScheduler();
  console.log("[Scheduler] Tareas programadas inicializadas (node-cron).");
});
