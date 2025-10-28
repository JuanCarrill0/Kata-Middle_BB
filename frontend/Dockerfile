FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración primero para aprovechar la caché de capas
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Configurar npm para ignorar errores de SSL
RUN npm config set strict-ssl false

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Asegurar permisos y directorios necesarios
RUN mkdir -p node_modules/.vite && \
    chmod 777 node_modules/.vite

# Exponer el puerto que usa Vite
EXPOSE 5173

# Comando para iniciar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev"]