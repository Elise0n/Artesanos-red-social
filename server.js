const express = require("express")
const session = require("express-session")
const flash = require("connect-flash")
const http = require("http")
const socketIo = require("socket.io")
const path = require("path")
require("dotenv").config()


// Importar rutas
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const imageRoutes = require("./routes/images")
const albumRoutes = require("./routes/albums")
const friendRoutes = require("./routes/friends")
const notificationRoutes = require("./routes/notifications")
const apiRoutes = require("./routes/api")

// Importar controladores
const homeController = require("./controllers/homeController")

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// Configuración del motor de plantillas
app.set("view engine", "pug")
app.set("views", path.join(__dirname, "views"))

// Middlewares globales
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(
  session({
    secret: process.env.SESSION_SECRET || "tu_clave_secreta_muy_segura",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  }),
)
app.use(flash())

// Middleware para pasar datos del usuario a todas las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user
  res.locals.messages = req.flash()
  next()
})

// Hacer io disponible en todas las rutas
app.use((req, res, next) => {
  req.io = io
  next()
})

// Ruta principal
app.get("/", homeController.index)

// Usar rutas modulares
app.use("/", authRoutes)
app.use("/", userRoutes)
app.use("/", imageRoutes)
app.use("/", albumRoutes)
app.use("/", friendRoutes)
app.use("/", notificationRoutes)
app.use("/api", apiRoutes)

// Socket.IO para notificaciones en tiempo real
io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id)

  socket.on("join", (userId) => {
    socket.join(`user_${userId}`)
    console.log(`Usuario ${userId} se unió a su sala`)
  })

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id)
  })
})

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Página no encontrada",
    message: "La página que buscas no existe",
    error: { status: 404 },
  })
})

// Manejo de errores del servidor
app.use((err, req, res, next) => {
  console.error("Error del servidor:", err.stack)

  // No mostrar detalles del error en producción
  const isDevelopment = process.env.NODE_ENV !== "production"

  res.status(err.status || 500).render("error", {
    title: "Error del servidor",
    message: isDevelopment ? err.message : "Ha ocurrido un error interno",
    error: isDevelopment ? err : { status: 500 },
  })
})

// Iniciar servidor
const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`)
  console.log(`📱 Aplicación disponible en http://localhost:${PORT}`)
})

// Manejo de cierre graceful
process.on("SIGTERM", () => {
  console.log("Cerrando servidor...")
  server.close(() => {
    console.log("Servidor cerrado")
    process.exit(0)
  })
})

