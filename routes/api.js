const express = require("express")
const router = express.Router()
const { requireAuth } = require("../middleware/auth")
const { promiseDb } = require("../config/database")

// API para contar notificaciones no vistas
router.get("/notification-count", requireAuth, async (req, res) => {
  try {
    const [result] = await promiseDb.execute(
      "SELECT COUNT(*) as count FROM notificacion WHERE id_usuario = ? AND visto = 0",
      [req.session.user.id],
    )
    res.json({ count: result[0].count })
  } catch (error) {
    console.error("Error al contar notificaciones:", error)
    res.status(500).json({ error: "Error del servidor" })
  }
})

// API para feed con paginación
router.get("/feed", requireAuth, async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = 10
    const offset = (page - 1) * limit

    const [images] = await promiseDb.execute(
      `
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
    `,
      [req.session.user.id, req.session.user.id, limit, offset],
    )

    res.json({ images: images || [] })
  } catch (error) {
    console.error("Error al obtener feed:", error)
    res.status(500).json({ error: "Error del servidor" })
  }
})

// API para dar/quitar like
router.post("/image/:id/like", requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    // Verificar si ya existe el like
    const [existing] = await promiseDb.execute("SELECT * FROM like_imagen WHERE imagen_id = ? AND usuario_id = ?", [
      id,
      req.session.user.id,
    ])

    if (existing.length > 0) {
      // Quitar like
      await promiseDb.execute("DELETE FROM like_imagen WHERE imagen_id = ? AND usuario_id = ?", [
        id,
        req.session.user.id,
      ])
    } else {
      // Agregar like
      await promiseDb.execute("INSERT INTO like_imagen (imagen_id, usuario_id) VALUES (?, ?)", [
        id,
        req.session.user.id,
      ])
    }

    // Contar likes actuales
    const [countResult] = await promiseDb.execute("SELECT COUNT(*) as count FROM like_imagen WHERE imagen_id = ?", [id])

    const likeCount = countResult[0].count
    const liked = existing.length === 0

    res.json({ success: true, liked, likeCount })
  } catch (error) {
    console.error("Error al procesar like:", error)
    res.status(500).json({ error: "Error del servidor" })
  }
})

// API para verificar estado de amistad
router.get("/friendship-status/:userId", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params

    const [result] = await promiseDb.execute(
      `
      SELECT estado, id_emisor, id_receptor, id_solicitud
      FROM solicitud_amistad 
      WHERE ((id_emisor = ? AND id_receptor = ?) OR (id_emisor = ? AND id_receptor = ?))
      ORDER BY fecha_envio DESC
      LIMIT 1
    `,
      [req.session.user.id, userId, userId, req.session.user.id],
    )

    if (result.length === 0) {
      return res.json({ status: "none" })
    }

    const friendship = result[0]
    let status = friendship.estado

    if (status === "pendiente") {
      status = friendship.id_emisor == req.session.user.id ? "sent" : "received"
    }

    res.json({
      status: status,
      requestId: friendship.id_solicitud,
      isEmitter: friendship.id_emisor == req.session.user.id,
    })
  } catch (error) {
    console.error("Error al verificar estado de amistad:", error)
    res.status(500).json({ error: "Error del servidor" })
  }
})

// API para sugerencias de amistad
router.get("/friend-suggestions", requireAuth, async (req, res) => {
  try {
    const [suggestions] = await promiseDb.execute(
      `
      SELECT u.id_usuario, u.nombre, u.apellido, u.imagen_perfil, u.intereses,
             0 as mutual_friends
      FROM usuario u
      WHERE u.id_usuario != ?
      AND u.id_usuario NOT IN (
        SELECT CASE 
          WHEN id_emisor = ? THEN id_receptor 
          ELSE id_emisor 
        END
        FROM solicitud_amistad 
        WHERE (id_emisor = ? OR id_receptor = ?) 
        AND estado IN ('aceptada', 'pendiente')
      )
      ORDER BY RAND()
      LIMIT 10
    `,
      [req.session.user.id, req.session.user.id, req.session.user.id, req.session.user.id],
    )

    res.json({ suggestions: suggestions || [] })
  } catch (error) {
    console.error("Error al obtener sugerencias:", error)
    res.status(500).json({ error: "Error del servidor" })
  }
})

// API para estadísticas del usuario
router.get("/user-stats", requireAuth, async (req, res) => {
  try {
    // Contar álbumes
    const [albumCount] = await promiseDb.execute("SELECT COUNT(*) as count FROM album WHERE id_usuario = ?", [
      req.session.user.id,
    ])

    // Contar imágenes
    const [imageCount] = await promiseDb.execute(
      `SELECT COUNT(*) as count FROM imagen i 
       JOIN album a ON i.id_album = a.id_album 
       WHERE a.id_usuario = ?`,
      [req.session.user.id],
    )

    // Contar amigos
    const [friendCount] = await promiseDb.execute(
      `SELECT COUNT(*) as count FROM solicitud_amistad 
       WHERE (id_emisor = ? OR id_receptor = ?) AND estado = 'aceptada'`,
      [req.session.user.id, req.session.user.id],
    )

    // Contar likes recibidos
    const [likeCount] = await promiseDb.execute(
      `SELECT COUNT(*) as count FROM like_imagen li
       JOIN imagen i ON li.imagen_id = i.id_imagen
       JOIN album a ON i.id_album = a.id_album
       WHERE a.id_usuario = ?`,
      [req.session.user.id],
    )

    res.json({
      albums: albumCount[0].count,
      images: imageCount[0].count,
      friends: friendCount[0].count,
      likes: likeCount[0].count,
    })
  } catch (error) {
    console.error("Error al obtener estadísticas:", error)
    res.status(500).json({ error: "Error del servidor" })
  }
})

module.exports = router
