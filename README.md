# Portal de Capacitaciones Interactivo

Plataforma de capacitaciones para el CoE de Desarrollo donde los colaboradores pueden gestionar y acceder a capacitaciones técnicas, obteniendo insignias por sus logros.

## Características Principales

- 👤 Autenticación de usuarios con correo corporativo
- ⬆️ Subida de contenido multimedia (videos, PDFs, presentaciones)
- 📚 Módulos de capacitación:
  - Fullstack (Frontend, Backend)
  - APIs e Integraciones
  - Cloud
  - Data Engineer
- 🎓 Seguimiento de progreso
- 🏅 Sistema de insignias automáticas
- 📑 Organización por capítulos
- 🔔 Sistema de notificaciones

## Tecnologías

- Frontend: React + TypeScript
- Backend: Node.js + Express + TypeScript
- Base de datos: MongoDB
* Almacenamiento: GridFS (MongoDB) para documentos y archivos; MinIO no se usa en la versión final
- Emails: Mailhog (desarrollo)
- Contenedores: Docker

## Requisitos

- Node.js v18+
- Docker y Docker Compose
- MongoDB
*(MinIO removed — storage now uses GridFS/DB)

## Configuración del Entorno de Desarrollo

1. Clonar el repositorio
2. Configurar variables de entorno (ver `.env.example`)
3. Iniciar servicios con Docker Compose:
   ```bash
   docker-compose up -d
   ```
4. Instalar dependencias del backend:
   ```bash
   cd backend
   npm install
   ```
5. Instalar dependencias del frontend:
   ```bash
   cd frontend
   npm install
   ```

## Estructura del Proyecto

```
.
├── frontend/               # Aplicación React
├── backend/               # API Node.js
├── docker/               # Configuraciones Docker
└── docs/                 # Documentación
```

## Diagramas y entregables

Incluimos un diagrama de arquitectura y materiales en la carpeta `entregables_documentacion`. Puedes ver el diagrama principal a continuación:

![Diagrama de arquitectura](./entregables_documentacion/Diagrama%20arquitectura%20Kata.png)

## Scripts de base de datos (seed)

En `backend/src/scripts/` encontrarás scripts para poblar la base de datos con datos de ejemplo:

- `backend/src/scripts/seed-db.ts` — script TypeScript que crea módulos, usuarios (teacher y student), cursos, badges y entradas en `history` para desarrollo.

Cómo ejecutar el seed (desde la carpeta `backend`):

1. Instala dependencias si no lo hiciste:

```powershell
cd backend
npm install
```

2. Ejecuta el script con ts-node (recomendado para desarrollo):

```powershell
npx ts-node src/scripts/seed-db.ts
```

Si prefieres, puedes usar `ts-node-dev` para recarga automática:

```powershell
npx ts-node-dev --respawn --transpile-only src/scripts/seed-db.ts
```

Advertencia: los scripts de seed limpian colecciones relevantes (Module, User, Course, Badge, History) antes de insertar datos; no los ejecutes en producción.