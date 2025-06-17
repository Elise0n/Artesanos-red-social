const { promiseDb } = require("../config/database")

const homeController = {
  // Página principal
  index: async (req, res) => {
    try {
      if (req.session.user) {
        // Obtener imágenes del feed
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
          LIMIT 20
        `,
          [req.session.user.id, req.session.user.id],
        )

        // Obtener notificaciones no vistas
        const [notifResult] = await promiseDb.execute(
          "SELECT COUNT(*) as count FROM notificacion WHERE id_usuario = ? AND visto = 0",
          [req.session.user.id],
        )

        const notificationCount = notifResult[0].count

        res.render("index", {
          images: images || [],
          notificationCount,
        })
      } else {
        res.render("landing")
      }
    } catch (error) {
      console.error("Error en página principal:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar la página principal",
      })
    }
  },
}

module.exports = homeController
