AATemperature - Sistema de Monitoreo de Aires Acondicionados
Este proyecto es una aplicación web diseñada para monitorear y gestionar las lecturas de temperatura y humedad de aires acondicionados, así como para llevar un registro de sus mantenimientos y configurar umbrales de alerta. Está pensado para entornos donde el control ambiental es crucial, como centros de datos o salas de equipos sensibles (ej. DCCE).

✨ Características Principales
Dashboard: Vista general con resúmenes clave (total de aires, lecturas, mantenimientos, alertas activas) y las últimas lecturas registradas.
Gestión de Aires Acondicionados: CRUD (Crear, Leer, Actualizar, Eliminar) para los equipos de aire acondicionado, registrando nombre, ubicación y fecha de instalación.
Registro de Lecturas: CRUD para las mediciones de temperatura y humedad asociadas a cada aire. Incluye filtrado por aire acondicionado.
Gestión de Mantenimientos: Registro de intervenciones (preventivas, correctivas, etc.), incluyendo técnico, descripción y carga opcional de imágenes como evidencia. Filtrado por aire.
Gestión de Umbrales: Definición de rangos aceptables de temperatura y humedad. Pueden ser globales (aplican a todos los aires) o específicos por equipo. Permite activar/desactivar notificaciones.
Estadísticas: Visualización de datos históricos y promedios mediante gráficos (líneas y barras) para:
Tendencias generales de temperatura y humedad.
Comparativas entre ubicaciones.
Historial y estadísticas por aire acondicionado específico.
Gestión de Usuarios: (Acceso restringido a Administradores) CRUD para usuarios, asignación de roles (Admin, Supervisor, Operador) y activación/desactivación de cuentas.
Control de Acceso Basado en Roles: Diferentes funcionalidades están disponibles según el rol del usuario logueado (Admin, Supervisor, Operador).
Autenticación: Sistema de inicio de sesión seguro.
Interfaz Responsiva: Construida con React Bootstrap para adaptarse a diferentes tamaños de pantalla.
💻 Pila Tecnológica
Frontend:
React (v17+) con TypeScript
React Router (v6) para enrutamiento
React Bootstrap & Bootstrap (v5) para UI y componentes
Axios para peticiones HTTP al backend
Chart.js & react-chartjs-2 para visualización de datos
React Icons para iconografía
Context API de React para gestión de estado global (autenticación, datos de usuario)
Backend: (Asumido - Especificar según la implementación real)
Node.js con Express.js (o similar: Python/Django/Flask, PHP/Laravel, etc.)
ORM/ODM como Sequelize, TypeORM, Mongoose (o consultas SQL directas)
JWT (JSON Web Tokens) para autenticación
Base de Datos: (Asumido - Especificar según la implementación real)
PostgreSQL, MySQL, MariaDB, MongoDB (o la base de datos elegida)
⚙️ Prerrequisitos
Node.js (v16 o superior recomendado)
npm (v8+) o yarn (v1.22+)
Git
Una instancia de la base de datos seleccionada (ej. PostgreSQL, MySQL) en ejecución.
El servidor Backend configurado y en ejecución.
🚀 Instalación y Configuración
Sigue estos pasos para configurar el proyecto en un entorno de producción.

1. Clonar el Repositorio:

bash
git clone <URL_DEL_REPOSITORIO>
cd AATemperature # O el nombre del directorio raíz del proyecto
2. Configurar el Backend:

Navega al directorio del backend: cd backend (o el nombre correspondiente).
Instala las dependencias:
bash
npm install
# o
yarn install
Configura las Variables de Entorno:
Crea un archivo .env en la raíz del directorio del backend.
Define las variables necesarias. Ejemplo:
env
NODE_ENV=production
PORT=5000 # Puerto en el que correrá el backend
DATABASE_URL="postgresql://user:password@host:port/database_name" # URL de conexión a tu BD de producción
JWT_SECRET="TU_SECRETO_JWT_MUY_SEGURO_PARA_PRODUCCION"
# Otras variables necesarias (ej. CORS_ORIGIN si es necesario)
CORS_ORIGIN=https://tudominio.com # El dominio donde estará el frontend
¡IMPORTANTE! Asegúrate de usar credenciales de base de datos y secretos JWT seguros para producción.
Base de Datos: Asegúrate de que la base de datos de producción exista y ejecuta las migraciones o scripts necesarios para crear las tablas/colecciones.
bash
# Ejemplo (si usas migraciones con Sequelize/TypeORM)
npm run db:migrate:prod
# o comandos equivalentes
(Opcional) Compilar TypeScript (si aplica): Si el backend está en TypeScript, compílalo a JavaScript:
bash
npm run build
3. Configurar el Frontend:

Navega al directorio del frontend: cd ../frontend (o el nombre correspondiente).
Instala las dependencias:
bash
npm install
# o
yarn install
Configura las Variables de Entorno:
Crea un archivo .env.production en la raíz del directorio del frontend.
Define la URL del backend de producción:
env
REACT_APP_API_URL=https://api.tudominio.com/api # URL PÚBLICA donde estará accesible tu API backend
¡CRÍTICO! REACT_APP_API_URL debe apuntar a la URL pública y correcta de tu API backend desplegada. El frontend (navegador del usuario) necesita acceder a esta URL. Ajusta /api si tu backend sirve la API bajo un prefijo específico.
Construir para Producción: Genera los archivos estáticos optimizados del frontend:
bash
npm run build
# o
yarn build
Esto creará una carpeta build dentro del directorio frontend con los archivos HTML, CSS y JS listos para ser desplegados.
▶️ Ejecución en Desarrollo
Para correr el proyecto localmente durante el desarrollo:

Iniciar Backend:
bash
cd backend
# Configura un .env para desarrollo (DB local, puerto diferente si es necesario)
npm run dev
# o comando equivalente para iniciar en modo desarrollo (ej. con nodemon)
Iniciar Frontend:
bash
cd ../frontend
# Configura un .env.development si necesitas sobreescribir variables (ej. REACT_APP_API_URL=http://localhost:5000/api)
npm start
# o
yarn start
El frontend estará disponible generalmente en http://localhost:3000.
☁️ Despliegue en Producción
1. Desplegar Backend:

Sube el código del backend (incluyendo el directorio node_modules si no lo reinstalas en el servidor, o solo el código fuente y el package.json si lo haces) a tu servidor de producción (VPS, PaaS como Heroku, contenedor Docker, etc.). Si compilaste TypeScript, sube la carpeta resultante (ej. dist).
Asegúrate de que las variables de entorno (.env) estén configuradas correctamente en el servidor de producción con los valores seguros. No subas el archivo .env al repositorio Git. Configúralo directamente en el servidor o mediante las herramientas de tu proveedor de hosting.
Instala las dependencias si es necesario (npm install --production o yarn install --production).
Inicia el servidor backend usando un gestor de procesos como PM2 o systemd para asegurar que se mantenga en ejecución y se reinicie en caso de fallo:
bash
# Ejemplo con PM2 (asumiendo que tu script de inicio es 'server.js' o 'dist/server.js')
pm2 start server.js --name aa-temperature-backend -i max --env production
pm2 save
pm2 startup
Configurar un Reverse Proxy (Nginx/Apache): Es altamente recomendable poner el backend detrás de un reverse proxy como Nginx. Esto permite:
Gestionar SSL/TLS (HTTPS).
Servir la API bajo un dominio/subdominio específico (ej. api.tudominio.com).
Balanceo de carga (si aplica).
Manejo de CORS.
2. Desplegar Frontend:

Sube el contenido de la carpeta frontend/build (generada en el paso de construcción) a tu servidor web o servicio de hosting estático (Netlify, Vercel, AWS S3 + CloudFront, Nginx, Apache).
Configurar el Servidor Web (Nginx/Apache):
El servidor web debe servir los archivos estáticos desde la carpeta donde subiste el contenido de build.

¡MUY IMPORTANTE! Debe estar configurado para manejar el enrutamiento del lado del cliente (client-side routing) de React Router. Esto significa que cualquier ruta que no sea un archivo existente (como /lecturas, /aires, etc.) debe redirigir internamente a index.html.

Ejemplo de configuración básica de Nginx:

nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com; # Tu dominio

    # Ubicación de los archivos estáticos del frontend
    root /var/www/aatemp/frontend/build; # Ruta donde subiste el contenido de 'build'
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html; # Manejo de rutas de React Router
    }

    # (Opcional pero recomendado) Configuración para HTTPS (Certbot, etc.)
    # listen 443 ssl;
    # ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    # include /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # (Opcional) Si quieres servir la API desde el mismo dominio bajo /api
    # location /api/ {
    #     proxy_pass http://localhost:5000/; # URL INTERNA de tu backend
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection 'upgrade';
    #     proxy_set_header Host $host;
    #     proxy_cache_bypass $http_upgrade;
    #     proxy_set_header X-Real-IP $remote_addr;
    #     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #     proxy_set_header X-Forwarded-Proto $scheme;
    # }
}
Asegúrate de que la variable REACT_APP_API_URL en el build del frontend apunta a la URL correcta y pública del backend (ej. https://api.tudominio.com/api o https://tudominio.com/api si usas el proxy en el mismo dominio).

3. Configurar DNS:

Apunta los registros DNS de tu dominio (ej. tudominio.com y api.tudominio.com si usas subdominio para el backend) a la dirección IP de tu servidor.
4. Seguridad (HTTPS):

Configura HTTPS/SSL en tu servidor web (Nginx/Apache) usando Let's Encrypt (Certbot) u otro proveedor de certificados. Es esencial para la seguridad en producción.
📝 Endpoints Principales de la API (Referencia)
El frontend interactúa con los siguientes endpoints base del backend (la URL base está definida en REACT_APP_API_URL):

/auth/login
/dashboard/resumen
/aires
/lecturas
/mantenimientos
/umbrales
/estadisticas/general
/estadisticas/aire/:id
/estadisticas/ubicacion
/usuarios
/usuarios/:id
/usuarios/:id/estado
/admin/users (Para creación de usuarios por admin)
(Otros endpoints específicos según la implementación)