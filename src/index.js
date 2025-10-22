const fs = require("fs");
const dotenv = require('dotenv');

// --- Carga de variables de entorno ---
// Usamos path.resolve para asegurar que encuentre .env desde cualquier ruta
const path = require('path');
const envConfig = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../.env'))); 
for (const k in envConfig) {
 process.env[k] = envConfig[k];
}

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 9000;

// --- Importación del Scheduler ---
const { startScheduler } = require('./services/schedulerService');

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
const mainRouter = require("./routes"); // Importa el índice
app.use("/api", mainRouter); // Usa el índice de rutas con el prefijo /api


// --- Ejecución del Servidor ---
app.listen(port, () => {
  console.log(`[Server] Running RAK Orion at port: ${port}`);
  
  // 1. Activación del Scheduler
  // Es mejor iniciar el scheduler aquí, justo después de que el servidor está escuchando.
  startScheduler();
  console.log("[Scheduler] Tareas programadas inicializadas (node-cron).");
});
