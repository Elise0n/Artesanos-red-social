const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const { requireAuth } = require("../middleware/auth")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Configuración de multer para imagen de perfil
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `perfil_${req.session.user.id}_${Date.now()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})
const upload = multer({ storage })

// Ruta POST para actualizar perfil
router.post("/perfil", requireAuth, upload.single("imagen_perfil"), async (req, res) => {
  if (req.file) {
    const nuevaImagen = req.file.filename
    const db = require("../config/database")

    const sql = "UPDATE usuario SET imagen_perfil = ? WHERE id_usuario = ?"
    db.query(sql, [nuevaImagen, req.session.user.id], (err) => {
      if (err) {
        console.error(err)
        req.flash("error", "No se pudo actualizar la imagen.")
      } else {
        req.session.user.imagen_perfil = nuevaImagen // actualizar sesión
        req.flash("success", "Imagen de perfil actualizada.")
      }
      res.redirect("/perfil")
    })
  } else {
    req.flash("error", "No se seleccionó ninguna imagen.")
    res.redirect("/perfil")
  }
})

// Rutas de usuarios
router.get("/profile/:id?", requireAuth, userController.showProfile)
router.get("/search", requireAuth, userController.search)

module.exports = router
