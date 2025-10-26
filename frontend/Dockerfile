# Etapa de construcción
FROM node:18-alpine as build

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY src/ ./src/
COPY index.html ./

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Instalar serve para servir la aplicación
RUN npm install -g serve

# Copiar archivos de construcción
COPY --from=build /app/dist /app/dist

# Exponer puerto
EXPOSE 5173

# Comando para iniciar la aplicación
CMD ["serve", "-s", "dist", "-l", "5173", "--single"]