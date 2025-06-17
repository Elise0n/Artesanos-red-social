const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const { requireAuth } = require("../middleware/auth")

// Rutas de usuarios
router.get("/profile/:id?", requireAuth, userController.showProfile)
router.get("/search", requireAuth, userController.search)

module.exports = router
