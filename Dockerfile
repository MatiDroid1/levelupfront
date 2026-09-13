# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependencias primero (mejor cache)
COPY package*.json ./
RUN npm ci

# Copia el resto y build
COPY . .
RUN npm run build

# ---- Runtime stage (Nginx) ----
FROM nginx:1.27-alpine

# Config para SPA (Angular) + caching básico
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia el build a la carpeta pública de nginx
# Nota: según tu output puede ser dist/<app>/browser o dist/<app>
COPY --from=build /app/dist/levelupgamer/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]