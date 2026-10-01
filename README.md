# Lumix Media 📸🎬
### Red Social Completa para Fotos y Vídeos con Cuentas de Usuario y Base de Datos Local

Una plataforma web moderna, rápida y completamente autónoma diseñada para publicar fotografías y vídeos en alta calidad. Permite a los usuarios registrarse creando su cuenta con nombre, usuario y contraseña, aplicar filtros visuales a sus imágenes o vídeos, dar "me gusta", guardar publicaciones y comentar en tiempo real.

**Incluye todos los archivos, esquema y base de datos necesarios para publicarlo directamente en GitHub o GitHub Pages.**

---

## ✨ Características Principales

1. **Autenticación Completa de Usuarios**:
   - Registro de cuenta con Nombre, `@nombre_de_usuario`, Correo Electrónico y Contraseña.
   - Subida y personalización de Foto de Perfil y Biografía.
   - Inicio de Sesión con validación de credenciales.
   - Cuentas de prueba preconfiguradas para pruebas inmediatas.
   - Persistencia de sesión de usuario activo.

2. **Publicación de Fotos y Vídeos**:
   - Soporte para **Fotografías** (JPG, PNG, WEBP, GIF).
   - Soporte para **Vídeos** (MP4, WebM) y captura directa con la cámara web.
   - Generador integrado de vídeos sintéticos procedurales en 9:16 (Aurora, Cyberpunk, Sunset) para pruebas sin necesidad de descargar archivos.
   - Proporciones seleccionables: `1:1` (Cuadrado), `4:5` (Retrato), `16:9` (Panorámica), `9:16` (Vertical/Reels).
   - 7 Filtros profesionales en tiempo real: *Original, Cinemático, Vintage, Blanco & Negro, Cálido, Dramático, Cyberpunk*.
   - Metadatos fotográficos: Título, pie de foto, hashtags automáticos, ubicación y detalles de cámara/lente (EXIF).

3. **Experiencia de Usuario y Vistas**:
   - **Feed Principal**: Historias de creadores activos, publicaciones con doble toque para dar *like* con animación de corazón, reproductor de vídeo con control de audio, guardado en favoritos y sección de comentarios interactiva.
   - **Reels / Pantalla Completa**: Reproductor de vídeo vertical inmersivo con desplazamiento con flechas del teclado, comentarios desplegables y música integrada.
   - **Explorar**: Galería visual estilo Bento/Pinterest con barra de búsqueda por creador, etiqueta o ubicación y pestañas de categorías.
   - **Perfil de Usuario**: Cabecera con estadísticas (publicaciones, seguidores, siguiendo), pestañas de fotos, vídeos y guardados, y modal para editar información personal.
   - **Base de Datos & GitHub**: Panel para exportar toda la base de datos a `.json`, importar respaldos y restaurar valores de fábrica.

4. **Base de Datos 100% Autónoma (Sin Servidores Externos)**:
   - Utiliza **IndexedDB** en el navegador para almacenar fotos, vídeos y registros sin los límites de 5MB de LocalStorage.
   - Viene presembrada con el archivo `src/db/initialData.json`.
   - Permite descargar la base de datos completa como archivo JSON en cualquier momento.

---

## 🚀 Cómo Publicar este Proyecto Directamente en GitHub

### Paso 1: Clonar o Inicializar el Repositorio

Si estás en tu terminal local dentro de la carpeta del proyecto:

```bash
# 1. Inicializar Git
git init

# 2. Agregar todos los archivos
git add .

# 3. Crear el primer commit
git commit -m "feat: Lumix Media - Red social con fotos, videos y base de datos"
```

### Paso 2: Conectar con tu Repositorio en GitHub

1. Entra a [github.com/new](https://github.com/new) y crea un nuevo repositorio (por ejemplo `lumix-media`).
2. Copia y ejecuta los siguientes comandos en tu terminal:

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/lumix-media.git
git push -u origin main
```

### Paso 3: Activar GitHub Pages (Despliegue Gratuito en la Nube)

El proyecto ya incluye el flujo automatizado corregido y optimizado en `.github/workflows/deploy.yml`:

1. En tu repositorio de GitHub, entra a la pestaña **Settings** (Configuración).
2. En la barra lateral izquierda, selecciona **Pages**.
3. En **Build and deployment > Source**, cambia la opción a **GitHub Actions**.
4. En **Settings > Actions > General > Workflow permissions**, asegúrate de que esté habilitada la opción *"Read and write permissions"*.
5. ¡Listo! En 1 o 2 minutos tu red social estará publicada y accesible en:
   `https://TU_USUARIO.github.io/lumix-media/`

> **Nota técnica**: El flujo de trabajo utiliza `npm install` con `package-lock.json` generado sin conflictos de dependencias peer y `base: './'` en `vite.config.ts` para garantizar que todas las rutas relativas de imágenes, scripts y estilos funcionen sin pantallas en blanco ni errores 404 en cualquier subdominio o subcarpeta de GitHub Pages.

---

## 💻 Desarrollo Local

Para probarlo o modificarlo en tu computadora:

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Previsualizar compilación
npm run preview
```

---

## 🗄️ Estructura del Proyecto

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # Despliegue automático a GitHub Pages
├── src/
│   ├── assets/                 # Fotos y avatares de muestra de alta fidelidad
│   ├── components/
│   │   ├── Navbar.tsx          # Barra de navegación principal
│   │   ├── FeedView.tsx        # Muro de publicaciones e interacciones
│   │   ├── ReelsView.tsx       # Reproductor inmersivo vertical
│   │   ├── ExploreView.tsx     # Explorador visual y buscador
│   │   ├── ProfileView.tsx     # Perfil de usuario y edición
│   │   ├── CreatePostModal.tsx # Publicación de foto/vídeo, cámara y filtros
│   │   ├── AuthModal.tsx       # Registro, inicio de sesión y perfiles demo
│   │   ├── DatabaseModal.tsx   # Gestor de base de datos y comandos GitHub
│   │   └── MediaLightbox.tsx   # Visor de pantalla completa y comentarios
│   ├── db/
│   │   ├── db.ts               # Motor IndexedDB persistente (CRUD completo)
│   │   └── initialData.json    # Archivo semilla de la base de datos
│   ├── utils/
│   │   └── mediaUtils.ts       # Generador de videos, filtros y miniaturas
│   ├── types.ts                # Modelos de TypeScript
│   ├── App.tsx                 # Componente raíz y orquestador de estado
│   └── main.tsx                # Entrada React 19
├── metadata.json               # Configuración de AI Studio
├── package.json                # Dependencias y scripts
└── README.md                   # Esta documentación
```

---

*Desarrollado para creadores visuales, fotógrafos y directores de cine.*
