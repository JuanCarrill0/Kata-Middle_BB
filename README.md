# Portal de Capacitaciones Interactivo

Plataforma destinada a la gestión y acceso a capacitaciones técnicas del CoE de Desarrollo.  
Permite administrar cursos, registrar el progreso de los usuarios y otorgar insignias automáticas por logros alcanzados.

## Características Principales

- 👤 Autenticación mediante correo corporativo  
- ⬆️ Carga de contenido multimedia (videos, documentos PDF, presentaciones)  
- 📚 Módulos de capacitación:  
  - Fullstack (Frontend, Backend)  
  - APIs e Integraciones  
  - Cloud  
  - Data Engineer  
- 🎓 Seguimiento de progreso de los usuarios  
- 🏅 Sistema automatizado de insignias  
- 📑 Organización jerárquica por capítulos  
- 🔔 Sistema de notificaciones  

## Tecnologías Utilizadas

- **Frontend:** React + TypeScript  
- **Backend:** Node.js + Express + TypeScript  
- **Base de datos:** MongoDB  
- **Almacenamiento:** GridFS (MongoDB) para documentos y archivos  
  *(MinIO no se utiliza en la versión final)*  
- **Contenedores:** Docker  

## Requisitos

- Node.js v18 o superior  
- Docker y Docker Compose  
- MongoDB  
*(MinIO eliminado — el almacenamiento se gestiona con GridFS/DB)*  

## Configuración del Entorno de Desarrollo

1. Clonar el repositorio.  
2. Configurar las variables de entorno según el archivo `.env.example`.  
3. Iniciar los servicios con Docker Compose:
   ```bash
   docker-compose up -d
   ```
4. Instalar las dependencias del backend:
   ```bash
   cd backend
   npm install
   ```
5. Instalar las dependencias del frontend:
   ```bash
   cd frontend
   npm install
   ```

## Estructura del Proyecto

```
.
├── frontend/               # Aplicación React
├── backend/                # API Node.js
├── docker/                 # Configuraciones Docker
└── docs/                   # Documentación
```

## Diagramas y Entregables

El diagrama de arquitectura y los materiales de documentación se encuentran en la carpeta `entregables_documentacion`.  

![Diagrama de arquitectura](./entregables_documentacion/Diagrama%20arquitectura%20Kata.png)

## Scripts de Base de Datos (Seed)

Los scripts para poblar la base de datos con datos de ejemplo están ubicados en `backend/src/scripts/`.

- **Archivo principal:** `seed-db.ts`  
  Este script genera módulos, usuarios (roles *teacher* y *student*), cursos, insignias y registros de historial de progreso para el entorno de desarrollo.

### Ejecución del Script

1. Instalar dependencias:  
   ```powershell
   cd backend
   npm install
   ```
2. Ejecutar el script con **ts-node**:  
   ```powershell
   npx ts-node src/scripts/seed-db.ts
   ```
3. Opcionalmente, utilizar **ts-node-dev** para recarga automática:  
   ```powershell
   npx ts-node-dev --respawn --transpile-only src/scripts/seed-db.ts
   ```

> ⚠️ **Advertencia:**  
> Los scripts de inicialización (*seed*) eliminan las colecciones relacionadas (`Module`, `User`, `Course`, `Badge`, `History`) antes de insertar los datos de ejemplo.  
> No deben ejecutarse en entornos de producción.
