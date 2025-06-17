const express = require("express")
const app = express()
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "No autorizado" })
  }
  next()
}
const db = require("./db") // Assuming db is imported from a database module

// Rutas adicionales para el servidor (agregar al server.js principal)

// API para contar notificaciones no vistas
app.get("/api/notification-count", requireAuth, (req, res) => {
  const query = "SELECT COUNT(*) as count FROM notificacion WHERE id_usuario = ? AND visto = 0"
  db.query(query, [req.session.user.id], (err, result) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Error del servidor" })
    }

    res.json({ count: result[0].count })
  })
})

// API para feed con paginación
app.get("/api/feed", requireAuth, (req, res) => {
  const page = Number.parseInt(req.query.page) || 1
  const limit = 10
  const offset = (page - 1) * limit

  const query = `
        SELECT i.*, a.titulo as album_titulo, u.nombre, u.apellido, u.imagen_perfil,
               GROUP_CONCAT(e.nombre) as etiquetas,
               (SELECT COUNT(*) FROM comentario WHERE imagen_id = i.id_imagen) as total_comentarios,
               (SELECT COUNT(*) FROM like_imagen WHERE imagen_id = i.id_imagen) as total_likes
        FROM imagen i
        JOIN album a ON i.id_album = a.id_album
        JOIN usuario u ON a.id_usuario = u.id_usuario
        LEFT JOIN imagen_etiqueta ie ON i.id_imagen = ie.id_imagen
        LEFT JOIN etiqueta e ON ie.id_etiqueta = e.id_etiqueta
        WHERE i.visibilidad = 'publica' OR 
              (i.visibilidad = 'amigos' AND EXISTS (
                  SELECT 1 FROM solicitud_amistad 
                  WHERE (id_emisor = ? AND id_receptor = u.id_usuario AND estado = 'aceptada')
                  OR (id_receptor = ? AND id_emisor = u.id_usuario AND estado = 'aceptada')
              ))
        GROUP BY i.id_imagen
        ORDER BY i.id_imagen DESC
        LIMIT ? OFFSET ?
    `

  db.query(query, [req.session.user.id, req.session.user.id, limit, offset], (err, images) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Error del servidor" })
    }

    res.json({ images: images || [] })
  })
})

// API para dar/quitar like
app.post("/image/:id/like", requireAuth, (req, res) => {
  const { id } = req.params

  // Verificar si ya existe el like
  const checkQuery = "SELECT * FROM like_imagen WHERE imagen_id = ? AND usuario_id = ?"
  db.query(checkQuery, [id, req.session.user.id], (err, existing) => {
    if (err) {
      console.error(err)
      return res.status(500).json({ error: "Error del servidor" })
    }

    if (existing.length > 0) {
      // Quitar like
      const deleteQuery = "DELETE FROM like_imagen WHERE imagen_id = ? AND usuario_id = ?"
      db.query(deleteQuery, [id, req.session.user.id], (err) => {
        if (err) {
          console.error(err)
          return res.status(500).json({ error: "Error del servidor" })
        }

        // Contar likes actuales
        const countQuery = "SELECT COUNT(*) as count FROM like_imagen WHERE imagen_id = ?"
        db.query(countQuery, [id], (err, countResult) => {
          const likeCount = countResult ? countResult[0].count : 0
          res.json({ success: true, liked: false, likeCount })
        })
      })
    } else {
      // Agregar like
      const insertQuery = "INSERT INTO like_imagen (imagen_id, usuario_id) VALUES (?, ?)"
      db.query(insertQuery, [id, req.session.user.id], (err) => {
        if (err) {
          console.error(err)
          return res.status(500).json({ error: "Error del servidor" })
        }

        // Contar likes actuales
        const countQuery = "SELECT COUNT(*) as count FROM like_imagen WHERE imagen_id = ?"
        db.query(countQuery, [id], (err, countResult) => {
          const likeCount = countResult ? countResult[0].count : 0
          res.json({ success: true, liked: true, likeCount })
        })
      })
    }
  })
})

// API para reportar contenido
app.post("/api/report", requireAuth, (req, res) => {
  const { type, id, reason } = req.body

  // Aquí implementarías la lógica para guardar reportes
  // Por simplicidad, solo logueamos el reporte
  console.log(`Reporte recibido: ${type} ${id} - ${reason} por usuario ${req.session.user.id}`)

  res.json({ success: true })
})

// Ruta para compartir imagen con contactos específicos
app.post("/image/:id/share", requireAuth, (req, res) => {
  const { id } = req.params
  const { userIds } = req.body

  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: "Debe especificar usuarios" })
  }

  // Verificar que el usuario es dueño de la imagen
  const ownerQuery = `
        SELECT i.* FROM imagen i
        JOIN album a ON i.id_album = a.id_album
        WHERE i.id_imagen = ? AND a.id_usuario = ?
    `

  db.query(ownerQuery, [id, req.session.user.id], (err, imageResult) => {
    if (err || imageResult.length === 0) {
      return res.status(403).json({ error: "No tienes permisos para compartir esta imagen" })
    }

    // Compartir con usuarios especificados
    const sharePromises = userIds.map((userId) => {
      return new Promise((resolve, reject) => {
        const shareQuery = "INSERT IGNORE INTO imagen_usuario_compartida (imagen_id, usuario_id) VALUES (?, ?)"
        db.query(shareQuery, [id, userId], (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })

    Promise.all(sharePromises)
      .then(() => {
        res.json({ success: true })
      })
      .catch((error) => {
        console.error(error)
        res.status(500).json({ error: "Error al compartir imagen" })
      })
  })
})
