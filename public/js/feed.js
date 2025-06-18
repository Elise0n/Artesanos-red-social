document.addEventListener("DOMContentLoaded", () => {
  let imagenActual = null;

  document.querySelectorAll(".ver-comentarios").forEach((btn) => {
    btn.addEventListener("click", async function () {
      imagenActual = this.dataset.id;
      const modal = new bootstrap.Modal(document.getElementById("modalComentarios"));
      const contenedor = document.getElementById("comentariosContenido");
      contenedor.innerHTML = "<i class='text-muted'>Cargando comentarios...</i>";
      await cargarComentarios(imagenActual);
      modal.show();
    });
  });

  async function cargarComentarios(id) {
    const contenedor = document.getElementById("comentariosContenido");
    const res = await fetch(`/api/image/${id}/comments`);
    const data = await res.json();

    if (data.success && data.comentarios.length > 0) {
      contenedor.innerHTML = "";
      data.comentarios.forEach((c) => {
        const eliminarBtn = c.esPropio
          ? `<button class="btn btn-sm btn-danger float-end eliminar-comentario" data-id="${c.id_comentario}">Eliminar</button>`
          : "";

        contenedor.innerHTML += `
          <div class="mb-3 border-bottom pb-2">
            <strong>${c.nombre} ${c.apellido}</strong> ${eliminarBtn}<br/>
            <small class="text-muted">${new Date(c.fecha).toLocaleString()}</small>
            <p>${c.texto}</p>
          </div>
        `;
      });
    } else {
      contenedor.innerHTML = "<p class='text-muted'>No hay comentarios aún.</p>";
    }
  }

  // Enviar nuevo comentario
  document.getElementById("formComentario").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("comentarioInput");
    const texto = input.value.trim();

    if (!texto) return;

    const res = await fetch(`/api/image/${imagenActual}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentario: texto }),
    });

    const data = await res.json();
    if (data.success) {
      input.value = "";
      await cargarComentarios(imagenActual);
    }
  });

  // Eliminar comentario
  document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("eliminar-comentario")) {
      const id = e.target.dataset.id;
      if (!confirm("¿Seguro que querés eliminar este comentario?")) return;

      const res = await fetch(`/api/comentarios/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        await cargarComentarios(imagenActual);
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ver-comentarios").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const modal = new bootstrap.Modal(document.getElementById("modalComentarios"));
      const contenido = document.getElementById("comentariosContenido");
      const form = document.getElementById("formComentario");

      // Limpio comentarios previos
      contenido.innerHTML = "<p>Cargando comentarios...</p>";

      // Cargo comentarios vía fetch
      const res = await fetch(`/api/image/${id}/comments`);
      const data = await res.json();

      if (data.success) {
        if (data.comentarios.length > 0) {
          contenido.innerHTML = "";
          data.comentarios.forEach((com) => {
            const div = document.createElement("div");
            div.classList.add("mb-2", "border-bottom", "pb-2");
            div.innerHTML = `<strong>${com.nombre}:</strong> ${com.texto}`;

            // Si el comentario es tuyo, mostramos botón eliminar
            if (com.propietario) {
              const btnDel = document.createElement("button");
              btnDel.classList.add("btn", "btn-sm", "btn-danger", "ms-2");
              btnDel.innerText = "Eliminar";
              btnDel.onclick = async () => {
                const r = await fetch(`/api/image/${id}/comments/${com.id}`, {
                  method: "DELETE",
                });
                const result = await r.json();
                if (result.success) div.remove();
              };
              div.appendChild(btnDel);
            }

            contenido.appendChild(div);
          });
        } else {
          contenido.innerHTML = "<p class='text-muted'>No hay comentarios aún.</p>";
        }
      } else {
        contenido.innerHTML = "<p class='text-danger'>Error al cargar comentarios.</p>";
      }

      // Manejo de nuevo comentario
      form.onsubmit = async (e) => {
        e.preventDefault();
        const texto = document.getElementById("comentarioInput").value;
        const r = await fetch(`/image/${id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comentario: texto }),
        });
        const result = await r.json();
        if (result.success) {
          document.querySelector(`.ver-comentarios[data-id="${id}"]`).click(); // recarga comentarios
        }
      };

      modal.show();
    });
  });
});
