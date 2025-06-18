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

router.delete("/api/image/:id/comments/:idComentario", requireAuth, (req, res) => {
    const { idComentario } = req.params;
    const id_usuario = req.session.user.id;
  
    const query = "DELETE FROM comentario WHERE id_comentario = ? AND id_usuario = ?";
  
    db.query(query, [idComentario, id_usuario], (err, result) => {
      if (err) return res.json({ success: false, error: "Error al eliminar" });
      if (result.affectedRows > 0) return res.json({ success: true });
      res.json({ success: false, error: "No autorizado o no existe" });
    });
  });
  