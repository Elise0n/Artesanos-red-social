const express = require("express")
const router = express.Router()
const albumController = require("../controllers/albumController")
const { requireAuth } = require("../middleware/auth")

// Rutas de álbumes
router.get("/create-album", requireAuth, albumController.showCreateAlbum)
router.post("/create-album", requireAuth, albumController.createAlbum)
router.get("/album/:id", requireAuth, albumController.showAlbum)
router.get("/album/:id/edit", requireAuth, albumController.showEditAlbum)
router.put("/album/:id", requireAuth, albumController.updateAlbum)
router.delete("/album/:id", requireAuth, albumController.deleteAlbum)

module.exports = router
