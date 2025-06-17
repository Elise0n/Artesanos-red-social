// Middleware de autenticación
function requireAuth(req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash("error", "Debes iniciar sesión para acceder a esta página")
    res.redirect("/login")
  }
}

// Middleware para verificar si el usuario ya está autenticado
function redirectIfAuth(req, res, next) {
  if (req.session.user) {
    res.redirect("/")
  } else {
    next()
  }
}

// Middleware para verificar si el usuario es propietario del recurso
function requireOwnership(req, res, next) {
  // Este middleware se puede personalizar según el recurso
  next()
}

module.exports = {
  requireAuth,
  redirectIfAuth,
  requireOwnership,
}
