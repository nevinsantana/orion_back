const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const PATH_ROUTES = __dirname; // La ruta absoluta a la carpeta routes/

// Función para limpiar el nombre del archivo (ej: users.js -> users)
const removeExtension = (fileName) => {
  return fileName.split('.').shift();
};

// Leer todos los archivos de la carpeta (ej: users.js, coins.js)
fs.readdirSync(PATH_ROUTES).filter((file) => {
  const name = removeExtension(file);
  
  // Excluir este archivo index.js para evitar un bucle
  if (name !== 'index') {
    // Carga dinámica de la ruta
    // Ejemplo: router.use('/users', require('./users'));
    router.use(`/${name}`, require(`./${file}`));
  }
});

module.exports = router;