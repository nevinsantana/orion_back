const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");
// Importar las funciones del controlador
const {
  getCoins,
  getCoin,
  postCoin,
  destroyCoin,
  updateCoin,
  restoreCoin,
  getDeletedCoins
} = require("../controllers/coinsController");


router.get("/", authMiddleware, getCoins); 
router.get("/deleted", authMiddleware, getDeletedCoins); 
router.get("/:id", authMiddleware, getCoin);
router.delete("/:id", authMiddleware, destroyCoin);
router.put('/:id', authMiddleware, updateCoin);
router.post("/restore/:id", authMiddleware, restoreCoin);
router.post("/", authMiddleware, postCoin);

module.exports = router;