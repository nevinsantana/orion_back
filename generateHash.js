const bcryptjs = require('bcryptjs');

async function generateHash() {
  const password = 'una_nueva_contraseña'; // tu contraseña
  const hash = await bcryptjs.hash(password, 10);
  console.log("Hash generado:", hash);
}

generateHash();
