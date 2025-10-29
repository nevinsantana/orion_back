# RAK Orion

### Descripción del Proyecto

**RAK Orion** es el _backend_ de una solución tecnológica para la gestión de clientes, facturación y procesos internos de **RAK S.A. de C.V.** Construido sobre **Node.js** y **Express**, este proyecto se enfoca en la eficiencia y la innovación, incluyendo módulos impulsados por **Inteligencia Artificial** para la automatización de tareas.

### Tecnologías y Dependencias

- **Node.js**: Entorno de ejecución de JavaScript.
- **Express**: _Framework_ web para la creación de la API.
- **Sequelize**: ORM para la interacción con la base de datos MySQL.
- **MySQL2**: Driver de base de datos para MySQL.
- **Nodemon**: Herramienta de desarrollo para el reinicio automático del servidor.
- **Dotenv**: Gestión de variables de entorno.
- **JSON Web Token (JWT)** y **Bcryptjs**: Para la autenticación y seguridad de la API.
- **Google Generative AI**: SDK para la integración con la API de Gemini.
- **Nodemailer**: Para el envío de correos electrónicos.
- **Node-Cron**: Módulo para la programación de tareas periódicas (Cronjobs).

### Instalación y Configuración

1. **Clonar el Repositorio**

```
git clone [https://github.com/RAK-Orion/orion_back.git](https://github.com/RAK-Orion/orion_back.git)
cd orion_back
```

1. **Instalar Dependencias**

- Ejecuta el siguiente comando para instalar todos los paquetes necesarios del proyecto.

```
npm install
```

1. **Configurar Variables de Entorno**

- Crea un archivo llamado **.env** en la raíz del proyecto.
- Copia y pega el siguiente contenido, y completa con tus credenciales de la base de datos y tus claves de API.

```
NODE_ENV=local

DB_HOST=127.0.0.1
DB_USER=main
DB_PASSWORD=1234
DB_NAME=orion_db
PORT=7777

JWT_SECRET=tu_clave_secreta_para_JWT

EMAIL_HOST=tu_host_smtp
EMAIL_PORT=tu_puerto
EMAIL_USER='tu_usuario'
EMAIL_PASS='tu_contraseña'
EMAIL_FROM='tu_email_de_envio'
FRONTEND_URL=http://localhost:7777

GEMINI_API_KEY=tu_api_key_de_gemini

# Configuración del Cronjob
CRON_PAYMENT_SCHEDULE="0 8 * * *"
```

### Módulos Implementados

#### **1. Seguimiento de Pagos y Notificaciones (Fase I & II)**

Este módulo centraliza la visibilidad de la cartera y automatiza el envío de recordatorios de pago, integrando el flujo de confirmación por código único.

- **Funcionalidades:**
  - Cálculo en tiempo real del estatus de la factura (Vencida, Por Vencer, Pagada).
  - Envío automático de correos (Cronjob) a las facturas próximas a vencer o vencidas.
  - Generación de un **Código de Comprobante Único** (`reminder_codes`) que el cliente usa para subir su pago.
- **Endpoints de Consulta (Fase I):**
  - `GET /api/paymentFollowUp/portfolio` - Devuelve la cartera completa con saldos y estatus calculados.
  - `GET /api/paymentFollowUp/:id` - Devuelve el detalle de una factura, incluyendo el historial de abonos (`paymentHistory`).

### Ejecución del Proyecto

- **Modo de Desarrollo**: Utiliza este comando para iniciar el servidor con Nodemon. Los cambios en el código se reflejarán automáticamente.

```
npm run dev
```

- **Modo de Producción**: Para un despliegue más estable y eficiente, usa este comando.

```
npm start
```

### Base de Datos y Migraciones

- **Ejecutar Migraciones**: Para crear todas las tablas en la base de datos, corre el siguiente comando:

```
npx sequelize-cli db:migrate
```

- **Deshacer Migraciones**: Si necesitas revertir todas las migraciones para empezar de cero, usa este comando con precaución:

```
npx sequelize-cli db:migrate:undo:all
```

### Pruebas de API

Para probar los _endpoints_ del proyecto, puedes importar la colección de Postman y seguir los siguientes pasos:

- **Importar Colección**: Descarga el archivo `coleccion_orion.json` y ábrelo en Postman.
- **Configurar Variables**:
  - **baseUrl**: `http://localhost:7777/api`
  - **auth_token**: Un _token_ válido para las rutas protegidas.

### Licencia

Este proyecto se distribuye bajo la licencia **ISC**.