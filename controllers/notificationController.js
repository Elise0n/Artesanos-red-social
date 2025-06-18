const { promiseDb } = require("../config/database")

const notificationController = {
  // Mostrar todas las notificaciones
  showNotifications: async (req, res) => {
    try {
      const [notifications] = await promiseDb.execute(
        `
        SELECT n.*, 
               CASE 
                   WHEN n.tipo = 'amistad' THEN (
                       SELECT CONCAT(u.nombre, ' ', u.apellido) 
                       FROM solicitud_amistad sa 
                       JOIN usuario u ON sa.id_emisor = u.id_usuario 
                       WHERE sa.id_receptor = n.id_usuario 
                       AND sa.estado = 'pendiente'
                       LIMIT 1
                   )
                   ELSE NULL
               END as emisor_nombre,
               CASE 
                   WHEN n.tipo = 'amistad' THEN (
                       SELECT sa.id_solicitud
                       FROM solicitud_amistad sa 
                       WHERE sa.id_receptor = n.id_usuario 
                       AND sa.estado = 'pendiente'
                       LIMIT 1
                   )
                   ELSE NULL
               END as solicitud_id
        FROM notificacion n
        WHERE n.id_usuario = ?
        ORDER BY n.fecha DESC
        LIMIT 50
      `,
        [req.session.user.id],
      )

      res.render("notifications", { notifications: notifications || [] })
    } catch (error) {
      console.error("Error al mostrar notificaciones:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar las notificaciones",
      })
    }
  },

  // Marcar notificacion como leida
  markAsRead: async (req, res) => {
    try {
      const { id } = req.params

      const [result] = await promiseDb.execute(
        "UPDATE notificacion SET visto = 1 WHERE id_notificacion = ? AND id_usuario = ?",
        [id, req.session.user.id],
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Notificación no encontrada" })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error al marcar notificacion:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },

  // Marcar todas las notificaciones como leidas
  markAllAsRead: async (req, res) => {
    try {
      await promiseDb.execute("UPDATE notificacion SET visto = 1 WHERE id_usuario = ? AND visto = 0", [
        req.session.user.id,
      ])

      res.json({ success: true })
    } catch (error) {
      console.error("Error al marcar todas las notificaciones:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },

  // Eliminar notificacion
  deleteNotification: async (req, res) => {
    try {
      const { id } = req.params

      const [result] = await promiseDb.execute(
        "DELETE FROM notificacion WHERE id_notificacion = ? AND id_usuario = ?",
        [id, req.session.user.id],
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Notificacion no encontrada" })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error al eliminar notificacion:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },
}

module.exports = notificationController
