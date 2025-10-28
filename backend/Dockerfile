FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de compilación
RUN apk add --no-cache python3 make g++

# Copiar package.json desde el directorio actual
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código del backend (directorio actual)
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 4000

# Ejecutar la versión compilada en producción
CMD ["node", "dist/index.js"]