FROM node:18-alpine

WORKDIR /app

# Instalar dependencias de compilación
RUN apk add --no-cache python3 make g++

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 4000

# Comando para iniciar la aplicación en modo desarrollo
CMD ["npm", "run", "dev"]