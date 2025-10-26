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
- Almacenamiento: MinIO
- Emails: Mailhog (desarrollo)
- Contenedores: Docker

## Requisitos

- Node.js v18+
- Docker y Docker Compose
- MongoDB
- MinIO

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