# Multi-stage build para Angular
# Stage 1: Build da aplicação
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json e package-lock.json
COPY frontend/package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY frontend/ ./

# Build da aplicação
RUN npm run build

# Stage 2: Servidor web (nginx)
FROM nginx:alpine

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist/frontend /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
