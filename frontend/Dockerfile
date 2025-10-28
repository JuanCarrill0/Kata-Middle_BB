FROM node:18-alpine

WORKDIR /app

# Copiar archivos
COPY package*.json ./
COPY . .

# Instalar todas las dependencias
RUN npm ci

# Construir la aplicación
RUN npm run build

# Instalar Vite globalmente para el preview
RUN npm install -g vite

EXPOSE 4173

CMD ["vite", "preview", "--host", "0.0.0.0", "--port", "4173"]