// routes/users.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");
// Importar las funciones del controlador
const {
  getUsers,
  getUser,
  postUser,
  destroyUser,
  updateUser,
  restoreUser,
  loginUsers,
  forgotPassword,
  resetPassword,
  getDeletedUsers
} = require("../controllers/usersController");

router.post("/login", loginUsers);
router.post("/forgot-password", forgotPassword);

router.get("/", authMiddleware, getUsers); 
router.get("/deleted", authMiddleware, getDeletedUsers); 
router.post("/", authMiddleware, postUser);
router.get("/:id", authMiddleware, getUser);
router.delete("/:id", authMiddleware, destroyUser);
router.put('/:id', authMiddleware, updateUser);
router.post("/restore/:id", authMiddleware, restoreUser);
router.post("/reset-password", resetPassword);


module.exports = router;