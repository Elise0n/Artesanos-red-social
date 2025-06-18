const bcrypt = require("bcryptjs")
const { promiseDb } = require("../config/database")

const authController = {
  // Mostrar formulario de registro
  showRegister: (req, res) => {
    res.render("register")
  },

  // Procesar registro
  register: async (req, res) => {
    try {
      const { nombre, apellido, email, password, intereses, antecedentes } = req.body

      // Validar datos
      if (!nombre || !apellido || !email || !password) {
        req.flash("error", "Todos los campos obligatorios deben ser completados")
        return res.redirect("/register")
      }

      // Verificar si el email ya existe
      const [existingUser] = await promiseDb.execute("SELECT id_usuario FROM usuario WHERE email = ?", [email])

      if (existingUser.length > 0) {
        req.flash("error", "El email ya esta registrado")
        return res.redirect("/register")
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10)
      const imagenPerfil = req.file ? `/uploads/${req.file.filename}` : null

      // Insertar usuario
      const [result] = await promiseDb.execute(
        "INSERT INTO usuario (nombre, apellido, email, contraseña, intereses, antecedentes, imagen_perfil) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nombre, apellido, email, hashedPassword, intereses, antecedentes, imagenPerfil],
      )

      req.flash("success", "Usuario registrado exitosamente")
      res.redirect("/login")
    } catch (error) {
      console.error("Error en registro:", error)
      req.flash("error", "Error al registrar usuario")
      res.redirect("/register")
    }
  },

  // Mostrar formulario de login
  showLogin: (req, res) => {
    res.render("login")
  },

  // Procesar login
  login: async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        req.flash("error", "Email y contraseña son requeridos")
        return res.redirect("/login")
      }

      // Buscar usuario
      const [users] = await promiseDb.execute("SELECT * FROM usuario WHERE email = ?", [email])

      if (users.length === 0) {
        req.flash("error", "Credenciales invalidas")
        return res.redirect("/login")
      }

      const user = users[0]

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.contraseña)

      if (!isValidPassword) {
        req.flash("error", "Credenciales invalidas")
        return res.redirect("/login")
      }

      // Crear sesion
      req.session.user = {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        imagen_perfil: user.imagen_perfil,
      }

      res.redirect("/")
    } catch (error) {
      console.error("Error en login:", error)
      req.flash("error", "Error al iniciar sesion")
      res.redirect("/login")
    }
  },

  // Cerrar sesion
  logout: (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al cerrar sesion:", err)
      }
      res.redirect("/")
    })
  },
}

module.exports = authController
