const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")
const upload = require("../middleware/upload")
const { redirectIfAuth } = require("../middleware/auth")

// Rutas de autenticación
router.get("/register", redirectIfAuth, authController.showRegister)
router.post("/register", redirectIfAuth, upload.single("imagen_perfil"), authController.register)
router.get("/login", redirectIfAuth, authController.showLogin)
router.post("/login", redirectIfAuth, authController.login)
router.get("/logout", authController.logout)

module.exports = router
