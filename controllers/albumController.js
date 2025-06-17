const { promiseDb } = require("../config/database")

const albumController = {
  // Mostrar formulario de creación de álbum
  showCreateAlbum: (req, res) => {
    res.render("create-album")
  },

  // Crear nuevo álbum
  createAlbum: async (req, res) => {
    try {
      const { titulo, descripcion, visibilidad } = req.body

      if (!titulo || titulo.trim() === "") {
        req.flash("error", "El título del álbum es requerido")
        return res.redirect("/create-album")
      }

      await promiseDb.execute("INSERT INTO album (titulo, id_usuario, visibilidad, descripcion) VALUES (?, ?, ?, ?)", [
        titulo.trim(),
        req.session.user.id,
        visibilidad || "publico",
        descripcion || null,
      ])

      req.flash("success", "Álbum creado exitosamente")
      res.redirect("/profile")
    } catch (error) {
      console.error("Error al crear álbum:", error)
      req.flash("error", "Error al crear el álbum")
      res.redirect("/create-album")
    }
  },

  // Ver álbum específico
  showAlbum: async (req, res) => {
    try {
      const { id } = req.params

      // Obtener información del álbum
      const [albumResult] = await promiseDb.execute(
        `
        SELECT a.*, u.nombre, u.apellido, u.imagen_perfil, u.id_usuario
        FROM album a
        JOIN usuario u ON a.id_usuario = u.id_usuario
        WHERE a.id_album = ?
      `,
        [id],
      )

      if (albumResult.length === 0) {
        return res.status(404).render("error", {
          title: "Álbum no encontrado",
          message: "El álbum que buscas no existe",
        })
      }

      const album = albumResult[0]

      // Verificar permisos de visualización
      if (album.visibilidad === "privado" && album.id_usuario !== req.session.user.id) {
        return res.status(403).render("error", {
          title: "Acceso denegado",
          message: "No tienes permisos para ver este álbum",
        })
      }

      // Si es solo para amigos, verificar amistad
      if (album.visibilidad === "amigos" && album.id_usuario !== req.session.user.id) {
        const [friendCheck] = await promiseDb.execute(
          `
          SELECT 1 FROM solicitud_amistad 
          WHERE ((id_emisor = ? AND id_receptor = ?) OR (id_emisor = ? AND id_receptor = ?))
          AND estado = 'aceptada'
        `,
          [req.session.user.id, album.id_usuario, album.id_usuario, req.session.user.id],
        )

        if (friendCheck.length === 0) {
          return res.status(403).render("error", {
            title: "Acceso denegado",
            message: "Este álbum es solo para amigos",
          })
        }
      }

      // Obtener imágenes del álbum
      const [images] = await promiseDb.execute(
        `
        SELECT i.*, GROUP_CONCAT(e.nombre) as etiquetas,
               (SELECT COUNT(*) FROM comentario WHERE imagen_id = i.id_imagen) as total_comentarios,
               (SELECT COUNT(*) FROM like_imagen WHERE imagen_id = i.id_imagen) as total_likes
        FROM imagen i
        LEFT JOIN imagen_etiqueta ie ON i.id_imagen = ie.id_imagen
        LEFT JOIN etiqueta e ON ie.id_etiqueta = e.id_etiqueta
        WHERE i.id_album = ?
        GROUP BY i.id_imagen
        ORDER BY i.id_imagen DESC
      `,
        [id],
      )

      res.render("album", { album, images: images || [] })
    } catch (error) {
      console.error("Error al mostrar álbum:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar el álbum",
      })
    }
  },

  // Editar álbum (solo propietario)
  showEditAlbum: async (req, res) => {
    try {
      const { id } = req.params

      const [albumResult] = await promiseDb.execute("SELECT * FROM album WHERE id_album = ? AND id_usuario = ?", [
        id,
        req.session.user.id,
      ])

      if (albumResult.length === 0) {
        return res.status(404).render("error", {
          title: "Álbum no encontrado",
          message: "El álbum no existe o no tienes permisos para editarlo",
        })
      }

      res.render("edit-album", { album: albumResult[0] })
    } catch (error) {
      console.error("Error al mostrar formulario de edición:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar el formulario de edición",
      })
    }
  },

  // Actualizar álbum
  updateAlbum: async (req, res) => {
    try {
      const { id } = req.params
      const { titulo, descripcion, visibilidad } = req.body

      if (!titulo || titulo.trim() === "") {
        req.flash("error", "El título del álbum es requerido")
        return res.redirect(`/album/${id}/edit`)
      }

      const [result] = await promiseDb.execute(
        "UPDATE album SET titulo = ?, descripcion = ?, visibilidad = ? WHERE id_album = ? AND id_usuario = ?",
        [titulo.trim(), descripcion || null, visibilidad, id, req.session.user.id],
      )

      if (result.affectedRows === 0) {
        return res.status(404).render("error", {
          title: "Álbum no encontrado",
          message: "El álbum no existe o no tienes permisos para editarlo",
        })
      }

      req.flash("success", "Álbum actualizado exitosamente")
      res.redirect(`/album/${id}`)
    } catch (error) {
      console.error("Error al actualizar álbum:", error)
      req.flash("error", "Error al actualizar el álbum")
      res.redirect("/create-album") // Corrected to redirect to /create-album
    }
  },

  // Eliminar álbum
  deleteAlbum: async (req, res) => {
    try {
      const { id } = req.params

      // Verificar que el álbum pertenece al usuario
      const [albumCheck] = await promiseDb.execute("SELECT id_album FROM album WHERE id_album = ? AND id_usuario = ?", [
        id,
        req.session.user.id,
      ])

      if (albumCheck.length === 0) {
        return res.status(404).json({ error: "Álbum no encontrado" })
      }

      // Verificar si el álbum tiene imágenes
      const [imageCheck] = await promiseDb.execute("SELECT COUNT(*) as count FROM imagen WHERE id_album = ?", [id])

      if (imageCheck[0].count > 0) {
        return res.status(400).json({
          error: "No se puede eliminar un álbum que contiene imágenes. Elimina primero todas las imágenes.",
        })
      }

      // Eliminar álbum
      await promiseDb.execute("DELETE FROM album WHERE id_album = ?", [id])

      res.json({ success: true })
    } catch (error) {
      console.error("Error al eliminar álbum:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },
}

module.exports = albumController
