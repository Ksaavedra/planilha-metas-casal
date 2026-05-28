# Artefatos: o workflow corre `npm run build` antes; contexto = pasta frontend
FROM nginx:1.27-alpine
COPY dist/frontend/browser/ /usr/share/nginx/html/
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
