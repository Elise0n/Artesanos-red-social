const { promiseDb } = require("../config/database")

const userController = {
  // Mostrar perfil de usuario
  showProfile: async (req, res) => {
    try {
      const userId = req.params.id || req.session.user.id

      // Obtener datos del usuario
      const [userResult] = await promiseDb.execute("SELECT * FROM usuario WHERE id_usuario = ?", [userId])

      if (userResult.length === 0) {
        return res.status(404).render("error", {
          title: "Usuario no encontrado",
          message: "El usuario que buscas no existe",
        })
      }

      const user = userResult[0]

      // Obtener álbumes del usuario
      const [albums] = await promiseDb.execute(
        `
        SELECT a.*, COUNT(i.id_imagen) as total_images
        FROM album a
        LEFT JOIN imagen i ON a.id_album = i.id_album
        WHERE a.id_usuario = ?
        GROUP BY a.id_album
        ORDER BY a.fecha_creacion DESC
      `,
        [userId],
      )

      // Verificar si son amigos
      const [friendResult] = await promiseDb.execute(
        `
        SELECT * FROM solicitud_amistad 
        WHERE ((id_emisor = ? AND id_receptor = ?) OR (id_emisor = ? AND id_receptor = ?))
        AND estado = 'aceptada'
      `,
        [req.session.user.id, userId, userId, req.session.user.id],
      )

      const isFriend = friendResult.length > 0
      const isOwnProfile = userId == req.session.user.id

      res.render("profile", {
        profileUser: user,
        albums: albums || [],
        isFriend,
        isOwnProfile,
      })
    } catch (error) {
      console.error("Error al mostrar perfil:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al cargar el perfil",
      })
    }
  },

  // Buscar usuarios e imágenes
  search: async (req, res) => {
    try {
      const { q } = req.query

      if (!q) {
        return res.render("search", { users: [], images: [], query: "" })
      }

      const searchTerm = `%${q}%`

      // Buscar usuarios
      const [users] = await promiseDb.execute(
        `
        SELECT id_usuario, nombre, apellido, email, imagen_perfil, intereses
        FROM usuario 
        WHERE (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?) AND id_usuario != ?
        LIMIT 10
      `,
        [searchTerm, searchTerm, searchTerm, req.session.user.id],
      )

      // Buscar imágenes
      const [images] = await promiseDb.execute(
        `
        SELECT i.*, a.titulo as album_titulo, u.nombre, u.apellido, u.imagen_perfil
        FROM imagen i
        JOIN album a ON i.id_album = a.id_album
        JOIN usuario u ON a.id_usuario = u.id_usuario
        LEFT JOIN imagen_etiqueta ie ON i.id_imagen = ie.id_imagen
        LEFT JOIN etiqueta e ON ie.id_etiqueta = e.id_etiqueta
        WHERE (i.titulo LIKE ? OR e.nombre LIKE ?) AND i.visibilidad = 'publica'
        GROUP BY i.id_imagen
        LIMIT 10
      `,
        [searchTerm, searchTerm],
      )

      res.render("search", {
        users: users || [],
        images: images || [],
        query: q,
      })
    } catch (error) {
      console.error("Error en búsqueda:", error)
      res.status(500).render("error", {
        title: "Error del servidor",
        message: "Error al realizar la búsqueda",
      })
    }
  },
}

module.exports = userController
