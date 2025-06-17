const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const requireAuth = require("../middleware/auth")
const db = require("../config/database")


// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => {
    const nombre = `perfil_${req.session.user.id}_${Date.now()}${path.extname(file.originalname)}`
    cb(null, nombre)
  },
})
const upload = multer({ storage })

//Ruta para actualizar imagen de perfil
router.post("/perfil", requireAuth, upload.single("imagen_perfil"), (req, res) => {
  if (!req.file) {
    req.flash("error", "Debes seleccionar una imagen.")
    return res.redirect("back")
  }

  const nuevaImagen = req.file.filename
  const id_usuario = req.session.user.id

  db.query(
    "UPDATE usuario SET imagen_perfil = ? WHERE id_usuario = ?",
    [nuevaImagen, id_usuario],
    (err) => {
      if (err) {
        console.error(err)
        req.flash("error", "Error al actualizar la imagen.")
      } else {
        req.session.user.imagen_perfil = nuevaImagen
        req.flash("success", "Imagen actualizada correctamente.")
      }
      res.redirect("back")
    }
  )
})

// Rutas de usuarios
router.get("/profile/:id?", requireAuth, userController.showProfile)
router.get("/search", requireAuth, userController.search)

module.exports = router
