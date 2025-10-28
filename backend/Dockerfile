FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de compilación
RUN apk add --no-cache python3 make g++

# Copiar solo package.json y package-lock.json desde la carpeta backend
# (esto permite que el contexto de build sea la raíz del repo)
COPY backend/package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código del backend
COPY backend .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 4000

# Ejecutar la versión compilada en producción
CMD ["node", "dist/index.js"]