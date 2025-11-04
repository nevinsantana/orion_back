
# RAK Orion

### Descripción del Proyecto

**RAK Orion** es el _backend_ de una solución tecnológica para la gestión de clientes, facturación y procesos internos de **RAK S.A. de C.V.** Construido sobre **Node.js** y **Express**, este proyecto se enfoca en la eficiencia y la innovación, incluyendo módulos impulsados por **Inteligencia Artificial** para la automatización de tareas.

### Tecnologías y Dependencias

-   **Node.js**: Entorno de ejecución de JavaScript.
    
-   **Express**: _Framework_ web para la creación de la API.
    
-   **Sequelize**: ORM para la interacción con la base de datos MySQL.
    
-   **MySQL2**: Driver de base de datos para MySQL.
    
-   **Nodemon**: Herramienta de desarrollo para el reinicio automático del servidor.
    
-   **Dotenv**: Gestión de variables de entorno.
    
-   **JSON Web Token (JWT)** y **Bcryptjs**: Para la autenticación y seguridad de la API.
    
-   **Google Generative AI**: SDK para la integración con la API de Gemini.
    
-   **Nodemailer**: Para el envío de correos electrónicos.
    
-   **node-cron**: Gestión de tareas programadas (Cronjobs).
    
-   **exceljs**: Generación de archivos de hoja de cálculo (XLSX).
    
-   **aws-sdk**: SDK para simulación de almacenamiento en la nube (S3 Mock).
    

### Módulos Principales Implementados

#### 1. Seguimiento de Pagos (Fase I: WS RU)

Módulo que calcula el estatus de las facturas (`Vencida`, `Por Vencer`, `Pagada`) y permite la consulta detallada de saldos e historial de abonos.

#### 2. Notificaciones y Códigos (Fase II: Automatización)

Sistema de _Cronjob_ que se ejecuta diariamente para enviar correos de recordatorio a clientes con facturas críticas. Genera un código único de confirmación de pago (`ReminderCode`).

#### 3. Reporte de Cartera con IA

Permite la generación de reportes XLS de la cartera de pagos y realiza un análisis financiero predictivo utilizando la API de Gemini. Utiliza un _mock_ de S3 para simular el almacenamiento de archivos.

### Instalación y Configuración

**1. Clonar e Instalar Dependencias**

```
git clone [https://github.com/RAK-Orion/orion_back.git](https://github.com/RAK-Orion/orion_back.git)
cd orion_back
npm install
```

**2. Configurar Variables de Entorno**

-   Crea un archivo llamado **.env** en la raíz del proyecto.
    
-   Completa el siguiente contenido con tus credenciales.
    

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
FRONTEND_URL=http://localhost:3000

# CONFIGURACIÓN DE REPORTES Y CLOUD
CRON_PAYMENT_SCHEDULE="0 8 * * *"
GEMINI_API_KEY=TU_CLAVE_REAL_DE_GOOGLE_GEMINI 
AWS_ACCESS_KEY_ID=MOCK_KEY_ID_RAK
AWS_SECRET_ACCESS_KEY=MOCK_SECRET_KEY_RAK
AWS_REGION=us-east-1
```

**3. Migraciones y Datos de Prueba**

-   Ejecuta los siguientes comandos para limpiar y preparar la base de datos:
    

```
# Limpia y vuelve a crear las tablas
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
# Inserta usuarios, clientes, facturas, pagos y códigos de prueba
npx sequelize-cli db:seed:all
```

### Ejecución del Proyecto

-   **Modo de Desarrollo**: Inicia el servidor y activa el _Scheduler_ con reinicio automático.
    

```
npm run dev
```

-   **Modo de Producción**: Para un despliegue más estable y eficiente.
    

```
npm start
```