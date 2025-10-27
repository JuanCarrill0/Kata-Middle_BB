FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración primero para aprovechar la caché de capas
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./

# Instalar dependencias
RUN npm install

# Limpiar caché de Vite si existe
RUN rm -rf node_modules/.vite

# Copiar el resto del código
COPY . .

# Crear directorio .vite con permisos correctos
RUN mkdir -p node_modules/.vite && chmod 777 node_modules/.vite

# Exponer el puerto que usa Vite
EXPOSE 5173

# Comando para iniciar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]