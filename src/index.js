const dotenv = require('dotenv');
const fs = require('fs');

// --- Carga de variables de entorno ---
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
 process.env[k] = envConfig[k];
}

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// --- Middlewares globales ---
app.use(express.json());
app.use(cors());

// --- Carga Dinámica de Rutas ---
const mainRouter = require('./routes'); // Importa el índice
app.use('/api', mainRouter); // Usa el índice de rutas con el prefijo /api

app.listen(port, () => {
 console.log(`Running at port: ${port}`);
});