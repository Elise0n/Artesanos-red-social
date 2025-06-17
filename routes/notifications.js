const express = require("express")
const router = express.Router()
const notificationController = require("../controllers/notificationController")
const { requireAuth } = require("../middleware/auth")

// Rutas de notificaciones
router.get("/notifications", requireAuth, notificationController.showNotifications)
router.post("/notifications/:id/read", requireAuth, notificationController.markAsRead)
router.post("/notifications/mark-all-read", requireAuth, notificationController.markAllAsRead)
router.delete("/notifications/:id", requireAuth, notificationController.deleteNotification)

module.exports = router
