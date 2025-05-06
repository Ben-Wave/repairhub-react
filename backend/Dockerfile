# Backend Dockerfile
FROM node:16-alpine

WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install

# App-Dateien kopieren
COPY . .

# Port freigeben
EXPOSE 5000

# App starten
CMD ["npm", "start"]