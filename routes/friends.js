const express = require("express")
const router = express.Router()
const friendController = require("../controllers/friendController")
const { requireAuth } = require("../middleware/auth")

// Rutas de amigos
router.get("/friends", requireAuth, friendController.showFriends)
router.get("/friend-requests-sent", requireAuth, friendController.showSentRequests)
router.post("/friend-request/:userId", requireAuth, friendController.sendFriendRequest)
router.post("/friend-request/:requestId/:action", requireAuth, friendController.respondFriendRequest)
router.delete("/friend-request/:requestId", requireAuth, friendController.cancelFriendRequest)
router.delete("/friendship/:userId", requireAuth, friendController.removeFriendship)

module.exports = router
