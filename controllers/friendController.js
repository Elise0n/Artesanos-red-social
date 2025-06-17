const { promiseDb } = require("../config/database")

const friendController = {
  // Mostrar lista de amigos
  showFriends: async (req, res) => {
    try {
      const [friends] = await promiseDb.execute(
        `
        SELECT DISTINCT u.id_usuario, u.nombre, u.apellido, u.email, u.imagen_perfil, u.intereses,
               sa.fecha_respuesta as fecha_amistad
        FROM usuario u
        JOIN solicitud_amistad sa ON (
          (sa.id_emisor = u.id_usuario AND sa.id_receptor = ?) OR
          (sa.id_receptor = u.id_usuario AND sa.id_emisor = ?)
        )
        WHERE sa.estado = 'aceptada' AND u.id_usuario != ?
        ORDER BY sa.fecha_respuesta DESC
      `,
        [req.session.user.id, req.session.user.id, req.session.user.id],
      )

      res.render("friends", { friends: friends || [] })
    } catch (error) {
      console.error("Error al mostrar amigos:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar la lista de amigos",
      })
    }
  },

  // Mostrar solicitudes enviadas
  showSentRequests: async (req, res) => {
    try {
      const [sentRequests] = await promiseDb.execute(
        `
        SELECT sa.*, u.nombre, u.apellido, u.imagen_perfil
        FROM solicitud_amistad sa
        JOIN usuario u ON sa.id_receptor = u.id_usuario
        WHERE sa.id_emisor = ? AND sa.estado = 'pendiente'
        ORDER BY sa.fecha_envio DESC
      `,
        [req.session.user.id],
      )

      res.render("friend-requests-sent", { sentRequests: sentRequests || [] })
    } catch (error) {
      console.error("Error al mostrar solicitudes enviadas:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar solicitudes enviadas",
      })
    }
  },

  // Enviar solicitud de amistad
  sendFriendRequest: async (req, res) => {
    try {
      const { userId } = req.params

      // Verificar que no exista ya una solicitud
      const [existing] = await promiseDb.execute(
        `
        SELECT * FROM solicitud_amistad 
        WHERE (id_emisor = ? AND id_receptor = ?) OR (id_emisor = ? AND id_receptor = ?)
      `,
        [req.session.user.id, userId, userId, req.session.user.id],
      )

      if (existing.length > 0) {
        return res.status(400).json({ error: "Ya existe una solicitud entre estos usuarios" })
      }

      // Crear nueva solicitud
      await promiseDb.execute("INSERT INTO solicitud_amistad (id_emisor, id_receptor) VALUES (?, ?)", [
        req.session.user.id,
        userId,
      ])

      // Crear notificación
      const mensaje = `${req.session.user.nombre} ${req.session.user.apellido} te ha enviado una solicitud de amistad`

      await promiseDb.execute("INSERT INTO notificacion (id_usuario, tipo, mensaje) VALUES (?, ?, ?)", [
        userId,
        "amistad",
        mensaje,
      ])

      // Emitir notificación en tiempo real
      req.io.emit(`notification_${userId}`, {
        type: "amistad",
        message: mensaje,
      })

      res.json({ success: true })
    } catch (error) {
      console.error("Error al enviar solicitud:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },

  // Responder solicitud de amistad
  respondFriendRequest: async (req, res) => {
    try {
      const { requestId, action } = req.params

      if (!["accept", "reject"].includes(action)) {
        return res.status(400).json({ error: "Acción inválida" })
      }

      const estado = action === "accept" ? "aceptada" : "rechazada"

      // Actualizar solicitud
      const [result] = await promiseDb.execute(
        "UPDATE solicitud_amistad SET estado = ?, fecha_respuesta = NOW() WHERE id_solicitud = ? AND id_receptor = ?",
        [estado, requestId, req.session.user.id],
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Solicitud no encontrada" })
      }

      // Obtener información del emisor para notificar
      const [emitterResult] = await promiseDb.execute(
        `
        SELECT sa.id_emisor, u.nombre, u.apellido 
        FROM solicitud_amistad sa
        JOIN usuario u ON sa.id_emisor = u.id_usuario
        WHERE sa.id_solicitud = ?
      `,
        [requestId],
      )

      if (emitterResult.length > 0) {
        const emitter = emitterResult[0]
        const mensaje = `${req.session.user.nombre} ${req.session.user.apellido} ${estado === "aceptada" ? "aceptó" : "rechazó"} tu solicitud de amistad`

        // Crear notificación para el emisor
        await promiseDb.execute("INSERT INTO notificacion (id_usuario, tipo, mensaje) VALUES (?, ?, ?)", [
          emitter.id_emisor,
          "amistad",
          mensaje,
        ])

        // Emitir notificación en tiempo real
        req.io.emit(`notification_${emitter.id_emisor}`, {
          type: "amistad",
          message: mensaje,
        })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error al responder solicitud:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },

  // Cancelar solicitud de amistad
  cancelFriendRequest: async (req, res) => {
    try {
      const { requestId } = req.params

      const [result] = await promiseDb.execute(
        "DELETE FROM solicitud_amistad WHERE id_solicitud = ? AND id_emisor = ? AND estado = 'pendiente'",
        [requestId, req.session.user.id],
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Solicitud no encontrada" })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error al cancelar solicitud:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },

  // Eliminar amistad
  removeFriendship: async (req, res) => {
    try {
      const { userId } = req.params

      const [result] = await promiseDb.execute(
        `
        DELETE FROM solicitud_amistad 
        WHERE ((id_emisor = ? AND id_receptor = ?) OR (id_emisor = ? AND id_receptor = ?))
        AND estado = 'aceptada'
      `,
        [req.session.user.id, userId, userId, req.session.user.id],
      )

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Amistad no encontrada" })
      }

      res.json({ success: true })
    } catch (error) {
      console.error("Error al eliminar amistad:", error)
      res.status(500).json({ error: "Error del servidor" })
    }
  },
}

module.exports = friendController
