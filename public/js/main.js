// JavaScript principal para Artesanos.com

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar tooltips de Bootstrap
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map((tooltipTriggerEl) => new window.bootstrap.Tooltip(tooltipTriggerEl))

  // Previsualización de imágenes en formularios de subida
  const imageInputs = document.querySelectorAll('input[type="file"][accept*="image"]')
  imageInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          // Buscar o crear elemento de previsualización
          let preview = document.getElementById("image-preview")
          if (!preview) {
            preview = document.createElement("img")
            preview.id = "image-preview"
            preview.className = "upload-preview"
            input.parentNode.appendChild(preview)
          }
          preview.src = e.target.result
          preview.style.display = "block"
        }
        reader.readAsDataURL(file)
      }
    })
  })

  // Confirmación para acciones destructivas
  const deleteButtons = document.querySelectorAll("[data-confirm]")
  deleteButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      const message = this.dataset.confirm || "¿Estás seguro?"
      if (!confirm(message)) {
        e.preventDefault()
      }
    })
  })

  // Auto-resize para textareas
  const textareas = document.querySelectorAll("textarea")
  textareas.forEach((textarea) => {
    textarea.addEventListener("input", function () {
      this.style.height = "auto"
      this.style.height = this.scrollHeight + "px"
    })
  })

  // Búsqueda en tiempo real
  const searchInput = document.querySelector('input[name="q"]')
  if (searchInput) {
    let searchTimeout
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout)
      const query = this.value.trim()

      if (query.length >= 2) {
        searchTimeout = setTimeout(() => {
          performLiveSearch(query)
        }, 500)
      }
    })
  }

  // Lazy loading para imágenes
  const images = document.querySelectorAll("img[data-src]")
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target
        img.src = img.dataset.src
        img.classList.remove("lazy")
        imageObserver.unobserve(img)
      }
    })
  })

  images.forEach((img) => imageObserver.observe(img))

  // Manejo de likes
  const likeButtons = document.querySelectorAll(".like-button")
  const loading = false // Declare loading variable here
  const page = 1 // Declare page variable here

  likeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const imageId = this.dataset.imageId
      toggleLike(imageId, this)
    })
  })

  // Scroll infinito para el feed
  window.addEventListener("scroll", () => {
    if (loading) return

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
      loadMoreContent()
    }
  })

  // Notificaciones en tiempo real
  if (typeof window.io !== "undefined" && window.currentUserId) {
    const socket = window.io()
    socket.emit("join", window.currentUserId)

    socket.on(`notification_${window.currentUserId}`, (data) => {
      showNotification(data.message, data.type)
      updateNotificationBadge()
    })
  }
})

// Funciones auxiliares

function performLiveSearch(query) {
  // Implementar búsqueda en tiempo real
  console.log("Buscando:", query)
  // Aquí se haría una petición AJAX para búsqueda en tiempo real
}

function toggleLike(imageId, button) {
  const isLiked = button.classList.contains("liked")
  const action = isLiked ? "unlike" : "like"

  fetch(`/image/${imageId}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        button.classList.toggle("liked")
        const countSpan = button.querySelector(".like-count")
        if (countSpan) {
          countSpan.textContent = data.likeCount
        }
      }
    })
    .catch((error) => console.error("Error:", error))
}

function loadMoreContent() {
  loading = true
  page++

  fetch(`/api/feed?page=${page}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.images && data.images.length > 0) {
        appendImagesToFeed(data.images)
      }
      loading = false
    })
    .catch((error) => {
      console.error("Error:", error)
      loading = false
    })
}

function appendImagesToFeed(images) {
  const feedContainer = document.querySelector(".feed-container")
  if (!feedContainer) return

  images.forEach((image) => {
    const imageElement = createImageElement(image)
    feedContainer.appendChild(imageElement)
  })
}

function createImageElement(image) {
  const div = document.createElement("div")
  div.className = "card mb-4"
  div.innerHTML = `
        <div class="card-header d-flex align-items-center">
            ${
              image.imagen_perfil
                ? `<img class="rounded-circle me-3" src="${image.imagen_perfil}" width="40" height="40">`
                : '<i class="fas fa-user-circle fa-2x me-3 text-muted"></i>'
            }
            <div>
                <h6 class="mb-0">${image.nombre} ${image.apellido}</h6>
                <small class="text-muted">${image.album_titulo}</small>
            </div>
        </div>
        <img class="card-img-top" src="${image.ruta_archivo}" alt="${image.titulo}" style="max-height: 500px; object-fit: cover;">
        <div class="card-body">
            <h5 class="card-title">${image.titulo}</h5>
            ${
              image.etiquetas
                ? `<div class="mb-2">
                    ${image.etiquetas
                      .split(",")
                      .map((tag) => `<span class="badge bg-secondary me-1">#${tag}</span>`)
                      .join("")}
                </div>`
                : ""
            }
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <button class="btn btn-outline-primary btn-sm me-2 like-button" data-image-id="${image.id_imagen}">
                        <i class="fas fa-heart me-1"></i>
                        <span class="like-count">${image.total_likes || 0}</span>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm">
                        <i class="fas fa-comment me-1"></i>
                        ${image.total_comentarios || 0}
                    </button>
                </div>
                <a class="btn btn-primary btn-sm" href="/image/${image.id_imagen}">Ver Detalles</a>
            </div>
        </div>
    `
  return div
}

function showNotification(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = "toast position-fixed top-0 end-0 m-3"
  toast.setAttribute("role", "alert")
  toast.innerHTML = `
        <div class="toast-header">
            <i class="fas fa-bell text-primary me-2"></i>
            <strong class="me-auto">Artesanos.com</strong>
            <small class="text-muted">ahora</small>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `

  document.body.appendChild(toast)
  const bsToast = new window.bootstrap.Toast(toast)
  bsToast.show()

  toast.addEventListener("hidden.bs.toast", () => {
    document.body.removeChild(toast)
  })
}

function updateNotificationBadge() {
  fetch("/api/notification-count")
    .then((response) => response.json())
    .then((data) => {
      const badge = document.getElementById("notification-badge")
      if (badge) {
        if (data.count > 0) {
          badge.textContent = data.count
          badge.style.display = "inline"
        } else {
          badge.style.display = "none"
        }
      }
    })
    .catch((error) => console.error("Error:", error))
}

// Utilidades para formularios
function validateForm(form) {
  const requiredFields = form.querySelectorAll("[required]")
  let isValid = true

  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      field.classList.add("is-invalid")
      isValid = false
    } else {
      field.classList.remove("is-invalid")
    }
  })

  return isValid
}

// Manejo de errores globales
window.addEventListener("error", (e) => {
  console.error("Error global:", e.error)
  // Aquí se podría enviar el error a un servicio de logging
})

// Funciones para compartir
function shareImage(imageId, platform) {
  const url = `${window.location.origin}/image/${imageId}`
  const text = "Mira esta increíble creación en Artesanos.com"

  switch (platform) {
    case "facebook":
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
      break
    case "twitter":
      window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`)
      break
    case "whatsapp":
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`)
      break
    default:
      // Copiar al portapapeles
      navigator.clipboard.writeText(url).then(() => {
        showNotification("Enlace copiado al portapapeles")
      })
  }
}

// Función para reportar contenido
function reportContent(type, id, reason) {
  fetch("/api/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: type,
      id: id,
      reason: reason,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification("Reporte enviado correctamente")
      } else {
        showNotification("Error al enviar el reporte", "error")
      }
    })
    .catch((error) => {
      console.error("Error:", error)
      showNotification("Error al enviar el reporte", "error")
    })
}
