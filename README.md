# Artesanos.com - Red Social para Artesanos

Una plataforma web completa diseñada para conectar artesanos, permitiéndoles compartir sus creaciones, interactuar con otros usuarios y construir una comunidad en torno al arte y la artesanía.

## Características Principales

### 🎨 Gestión de Usuarios
- Registro e inicio de sesión seguro
- Perfiles personalizables con imagen, intereses y antecedentes
- Sistema de autenticación con bcrypt

### 📸 Gestión de Contenido
- Subida de imágenes con organización en álbumes
- Sistema de etiquetas para categorizar obras
- Control de visibilidad (público/solo amigos)
- Comentarios en imágenes

### 👥 Red Social
- Sistema de solicitudes de amistad
- Búsqueda de usuarios e imágenes
- Feed personalizado basado en conexiones
- Compartir imágenes con contactos específicos

### 🔔 Notificaciones en Tiempo Real
- Notificaciones de solicitudes de amistad
- Alertas de nuevos comentarios
- Sistema de notificaciones con WebSockets
- Indicadores visuales de actividad no vista

### 🔍 Búsqueda y Descubrimiento
- Búsqueda de usuarios por nombre o email
- Búsqueda de imágenes por título o etiquetas
- Filtros avanzados de contenido

## Tecnologías Utilizadas

### Backend
- **Node.js** - Entorno de ejecución
- **Express.js** - Framework web
- **MySQL** - Base de datos relacional
- **Socket.IO** - Comunicación en tiempo real
- **bcrypt** - Encriptación de contraseñas
- **Multer** - Manejo de archivos

### Frontend
- **Pug** - Motor de plantillas
- **Bootstrap 5** - Framework CSS
- **Font Awesome** - Iconografía
- **JavaScript Vanilla** - Interactividad del cliente

## Instalación y Configuración

### Prerrequisitos
- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
\`\`\`bash
git clone https://github.com/Elise0n/Artesanos-red-social.git
cd Artesanos-red-social
\`\`\`

2. **Instalar dependencias**
\`\`\`bash
npm install
\`\`\`

3. **Configurar variables de entorno**
Crear archivo `.env` en la raíz del proyecto:
\`\`\`env
DB_HOST=tu_host_mysql
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=artesano_db
SESSION_SECRET=tu_clave_secreta_muy_segura
PORT=3000
\`\`\`

4. **Configurar base de datos**
- Importar el archivo SQL proporcionado en tu servidor MySQL
- Verificar que todas las tablas se hayan creado correctamente

5. **Crear directorio de uploads**
\`\`\`bash
mkdir public/uploads
\`\`\`

6. **Iniciar la aplicación**
\`\`\`bash
# Desarrollo
npm run dev

# Producción
npm start
\`\`\`

## Estructura del Proyecto

\`\`\`
Artesanos-red-social/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── uploads/
├── views/
│   ├── layout.pug
│   ├── index.pug
│   ├── login.pug
│   ├── register.pug
│   ├── profile.pug
│   ├── search.pug
│   ├── notifications.pug
│   ├── upload.pug
│   ├── create-album.pug
│   ├── album.pug
│   └── image.pug
├── server.js
├── package.json
├── .env
└── README.md
\`\`\`

## Funcionalidades Implementadas

### ✅ Requisitos Básicos para Regularizar
- [x] Envío de solicitudes de amistad
- [x] Aceptar/rechazar solicitudes de amistad
- [x] Publicar imágenes y compartirlas con contactos
- [x] Sistema de comentarios en imágenes

### ✅ Funcionalidades Adicionales
- [x] Sistema de notificaciones en tiempo real
- [x] Organización de imágenes en álbumes
- [x] Sistema de etiquetas
- [x] Búsqueda avanzada
- [x] Control de visibilidad de contenido
- [x] Interfaz responsive
- [x] Sistema de likes (implementado)

## API Endpoints

### Autenticación
- `GET /login` - Página de inicio de sesión
- `POST /login` - Procesar inicio de sesión
- `GET /register` - Página de registro
- `POST /register` - Procesar registro
- `GET /logout` - Cerrar sesión

### Usuarios
- `GET /profile/:id?` - Ver perfil de usuario
- `GET /search` - Buscar usuarios e imágenes
- `POST /friend-request/:userId` - Enviar solicitud de amistad
- `POST /friend-request/:requestId/:action` - Responder solicitud

### Contenido
- `GET /upload` - Formulario de subida
- `POST /upload` - Subir imagen
- `GET /create-album` - Formulario de álbum
- `POST /create-album` - Crear álbum
- `GET /album/:id` - Ver álbum
- `GET /image/:id` - Ver imagen individual
- `POST /image/:id/comment` - Agregar comentario
- `POST /image/:id/like` - Dar/quitar like

### Notificaciones
- `GET /notifications` - Ver notificaciones
- `POST /notifications/:id/read` - Marcar como leída
- `GET /api/notification-count` - Contar no vistas

## Despliegue

### Preparación para Producción
1. Configurar variables de entorno de producción
2. Optimizar imágenes y assets
3. Configurar proxy reverso (nginx recomendado)
4. Configurar SSL/HTTPS
5. Configurar backup de base de datos

### Servicios Recomendados
- **Hosting**: Heroku, DigitalOcean, AWS
- **Base de datos**: MySQL en la nube (PlanetScale, AWS RDS)
- **Almacenamiento**: AWS S3 para imágenes
- **CDN**: CloudFlare para assets estáticos

## Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## Soporte

Para reportar bugs o solicitar nuevas funcionalidades, por favor crear un issue en el repositorio de GitHub.

## Autor

Desarrollado como Trabajo Práctico Integrador para la materia Laboratorio web II.

**Artesanos.com** - Conectando artesanos, inspirando creatividad 🎨
