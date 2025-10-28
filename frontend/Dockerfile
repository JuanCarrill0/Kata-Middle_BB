FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY index.html ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar código fuente y construir
COPY . .
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y instalar dependencias de producción + vite
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Instalar Vite globalmente o como dependencia
RUN npm install -g vite

# Copiar build
COPY --from=builder /app/dist ./dist

# Exponer puerto de Vite Preview
EXPOSE 4173

# Usar Vite Preview
CMD ["vite", "preview", "--host", "0.0.0.0", "--port", "4173"]