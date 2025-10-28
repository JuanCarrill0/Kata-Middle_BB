FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración primero para mejor cache
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY index.html ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente y construir
COPY . .
RUN npm run build

# Etapa de producción con Vite Preview
FROM node:18-alpine

WORKDIR /app

# Copiar solo lo necesario
COPY package*.json ./
RUN npm ci --only=production

# Copiar build del stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Exponer puerto
EXPOSE 4173

# Usar Vite Preview para servir la aplicación
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "4173"]