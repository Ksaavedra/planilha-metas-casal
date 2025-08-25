@echo off
echo Iniciando JSON Server...
echo.
echo Servidor rodando em: http://localhost:3000
echo API disponivel em: http://localhost:3000/metas
echo.
echo Endpoints disponiveis:
echo - GET    /metas
echo - GET    /metas/:id
echo - POST   /metas
echo - PUT    /metas/:id
echo - DELETE /metas/:id
echo.
echo Pressione Ctrl+C para parar o servidor
echo.
json-server --watch db.json --port 3000
