const express = require("express")
const router = express.Router()
const imageController = require("../controllers/imageController")
const upload = require("../middleware/upload")
const { requireAuth } = require("../middleware/auth")

// Rutas de imágenes
router.get("/upload", requireAuth, imageController.showUpload)
router.post("/upload", requireAuth, upload.single("imagen"), imageController.upload)
router.get("/image/:id", requireAuth, imageController.showImage)
router.post("/image/:id/comment", requireAuth, imageController.addComment)

module.exports = router
