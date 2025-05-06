# Frontend Dockerfile
# Build-Stage
FROM node:16-alpine as build

WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# App-Dateien kopieren
COPY . .

# Build erstellen
RUN npm run build

# Production-Stage
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 90
CMD ["nginx", "-g", "daemon off;"]