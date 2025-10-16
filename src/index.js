//const dotenv = require('dotenv');
const fs = require("fs");
const dotenv = require('dotenv');

// --- Carga de variables de entorno ---
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
 process.env[k] = envConfig[k];
}

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.APP_PORT || 9000;
// const port = process.env.PORT || 9000;

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

app.listen(port, () => {
  console.log(`Running at port: ${port}`);
});