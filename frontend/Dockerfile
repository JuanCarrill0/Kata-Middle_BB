FROM node:18-alpine AS builder

WORKDIR /app

# Copiar TODOS los archivos de configuración
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY index.html ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependencias de producción INCLUYENDO vite
RUN npm ci --only=production

# 🔥 COPIAR EL VITE.CONFIG.TS A LA ETAPA DE PRODUCCIÓN
COPY vite.config.ts ./
COPY --from=builder /app/dist ./dist

EXPOSE 4173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]