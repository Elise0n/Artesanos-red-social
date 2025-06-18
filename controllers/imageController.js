const { promiseDb } = require("../config/database")

const imageController = {
  // Mostrar formulario de subida
  showUpload: async (req, res) => {
    try {
      // Obtener albumes del usuario
      const [albums] = await promiseDb.execute(
        "SELECT * FROM album WHERE id_usuario = ? ORDER BY fecha_creacion DESC",
        [req.session.user.id],
      )

      // Obtener etiquetas disponibles
      const [tags] = await promiseDb.execute("SELECT * FROM etiqueta ORDER BY nombre")

      res.render("upload", { albums: albums || [], tags: tags || [] })
    } catch (error) {
      console.error("Error al mostrar formulario de subida:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar el formulario de subida",
      })
    }
  },

  // Procesar subida de imagen
  upload: async (req, res) => {
    try {
      const { titulo, album_id, visibilidad, etiquetas } = req.body

      if (!req.file) {
        req.flash("error", "Debe seleccionar una imagen")
        return res.redirect("/upload")
      }

      const rutaArchivo = `/uploads/${req.file.filename}`

      // Insertar imagen
      const [result] = await promiseDb.execute(
        "INSERT INTO imagen (titulo, ruta_archivo, id_album, visibilidad) VALUES (?, ?, ?, ?)",
        [titulo, rutaArchivo, album_id, visibilidad],
      )

      const imagenId = result.insertId

      // Agregar etiquetas si existen
      if (etiquetas && etiquetas.length > 0) {
        const etiquetasArray = Array.isArray(etiquetas) ? etiquetas : [etiquetas]

        for (const etiquetaId of etiquetasArray) {
          await promiseDb.execute("INSERT INTO imagen_etiqueta (id_imagen, id_etiqueta) VALUES (?, ?)", [
            imagenId,
            etiquetaId,
          ])
        }
      }

      req.flash("success", "Imagen subida exitosamente")
      res.redirect("/")
    } catch (error) {
      console.error("Error al subir imagen:", error)
      req.flash("error", "Error al subir la imagen")
      res.redirect("/upload")
    }
  },

  // Ver imagen individual
  showImage: async (req, res) => {
    try {
      const { id } = req.params

      // Obtener imagen
      const [imageResult] = await promiseDb.execute(
        `
        SELECT i.*, a.titulo as album_titulo, u.nombre, u.apellido, u.imagen_perfil, u.id_usuario as autor_id,
               GROUP_CONCAT(e.nombre) as etiquetas
        FROM imagen i
        JOIN album a ON i.id_album = a.id_album
        JOIN usuario u ON a.id_usuario = u.id_usuario
        LEFT JOIN imagen_etiqueta ie ON i.id_imagen = ie.id_imagen
        LEFT JOIN etiqueta e ON ie.id_etiqueta = e.id_etiqueta
        WHERE i.id_imagen = ?
        GROUP BY i.id_imagen
      `,
        [id],
      )

      if (imageResult.length === 0) {
        return res.status(404).render("error", {
          title: "Imagen no encontrada",
          message: "La imagen que buscas no existe",
        })
      }

      const image = imageResult[0]

      // Obtener comentarios
      const [comments] = await promiseDb.execute(
        `
        SELECT c.*, u.nombre, u.apellido, u.imagen_perfil
        FROM comentario c
        JOIN usuario u ON c.usuario_id = u.id_usuario
        WHERE c.imagen_id = ?
        ORDER BY c.id_comentario DESC
      `,
        [id],
      )

      res.render("image", { image, comments: comments || [] })
    } catch (error) {
      console.error("Error al mostrar imagen:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar la imagen",
      })
    }
  },

  // Agregar comentario
  addComment: async (req, res) => {
    try {
      const { id } = req.params
      const { contenido } = req.body

      if (!contenido || contenido.trim() === "") {
        return res.status(400).json({ error: "El comentario no puede estar vacío" })
      }

      // Insertar comentario
      await promiseDb.execute("INSERT INTO comentario (contenido, imagen_id, usuario_id) VALUES (?, ?, ?)", [
        contenido.trim(),
        id,
        req.session.user.id,
      ])

      // Obtener información del autor de la imagen para notificar
      const [authorResult] = await promiseDb.execute(
        `
        SELECT u.id_usuario, u.nombre, u.apellido, i.titulo
        FROM imagen i
        JOIN album a ON i.id_album = a.id_album
        JOIN usuario u ON a.id_usuario = u.id_usuario
        WHERE i.id_imagen = ?
      `,
        [id],
      )

      if (authorResult.length > 0 && authorResult[0].id_usuario != req.session.user.id) {
        const author = authorResult[0]
        const mensaje = `${req.session.user.nombre} ${req.session.user.apellido} comentó tu imagen "${author.titulo}"`

        // Crear notificación
        await promiseDb.execute("INSERT INTO notificacion (id_usuario, tipo, mensaje) VALUES (?, ?, ?)", [
          author.id_usuario,
          "comentario",
          mensaje,
        ])

        // Emitir notificación en tiempo real
        req.io.emit(`notification_${author.id_usuario}`, {
          type: "comentario",
          message: mensaje,
        })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error al agregar comentario:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },
}

module.exports = imageController
