const express = require("express")
const router = express.Router()
const userController = require("../controllers/userController")
const multer = require("multer")
const path = require("path")
const { requireAuth } = require("../middleware/auth")
const { promiseDb } = require("../config/database")


// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => {
    const nombreArchivo = `perfil_${req.session.user.id}_${Date.now()}${path.extname(file.originalname)}`
    cb(null, nombreArchivo)
  },
})
const upload = multer({ storage })

//Ruta para actualizar imagen de perfil
router.post("/perfil", requireAuth, upload.single("imagen_perfil"), (req, res) => {
  if (!req.file) {
    req.flash("error", "Debes seleccionar una imagen.")
    return res.redirect("/perfil")
  }

  const nuevaImagen = req.file.filename
  const id_usuario = req.session.user.id

  promiseDb.execute(
    "UPDATE usuario SET imagen_perfil = ? WHERE id_usuario = ?",
    [nuevaImagen, id_usuario],
  )
    .then(() => {
      req.session.user.imagen_perfil = nuevaImagen
      req.flash("success", "Imagen actualizada correctamente.")
      res.redirect("/perfil")
    })
    .catch((error) => {
      console.error("Error al actualizar la imagen:", error)
      req.flash("error", "Error al actualizar la imagen.")
      res.redirect("/perfil")
    })
})

// Rutas de usuarios
router.get("/profile/:id?", requireAuth, userController.showProfile)
router.get("/search", requireAuth, userController.search)

module.exports = router
