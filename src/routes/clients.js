const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");
// Importar las funciones del controlador
const {
  getClients,
  getClient,
  postClient,
  destroyClient,
  updateClient,
  restoreClient,
} = require("../controllers/ClientsController");


router.get("/", authMiddleware, getClients); 
router.get("/:id", authMiddleware, getClient);
router.delete("/:id", authMiddleware, destroyClient);
router.put('/:id', authMiddleware, updateClient);
router.post("/restore/:id", authMiddleware, restoreClient);
router.post("/", authMiddleware, postClient);

module.exports = router;