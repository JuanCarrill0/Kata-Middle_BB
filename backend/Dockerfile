# Etapa de construcción
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm install

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar solo las dependencias de producción
RUN npm ci --only=production

# Copiar los archivos compilados desde la etapa de construcción
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 4000

# Comando para iniciar la aplicación
CMD ["npm", "start"]