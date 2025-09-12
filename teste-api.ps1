# 🧪 Script de Teste de Integração - Planilha Organização
# Testa a conectividade entre Frontend e Backend

Write-Host "🧪 TESTE DE INTEGRAÇÃO - PLANILHA ORGANIZAÇÃO" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

$API_BASE = "https://np56fbuwda.execute-api.sa-east-1.amazonaws.com/prod"

# Função para testar endpoint
function Testar-Endpoint {
    param(
        [string]$Nome,
        [string]$Url
    )
    
    Write-Host "`n🔍 Testando: $Nome" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10
        Write-Host "✅ SUCESSO!" -ForegroundColor Green
        Write-Host "Resposta: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor White
        return $true
    }
    catch {
        Write-Host "❌ ERRO!" -ForegroundColor Red
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Testes
Write-Host "`n📋 INICIANDO TESTES..." -ForegroundColor Cyan

$teste1 = Testar-Endpoint "Health Check" "$API_BASE/health"
$teste2 = Testar-Endpoint "Test Endpoint" "$API_BASE/test"

# Resultado geral
Write-Host "`n📊 RESULTADO GERAL:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($teste1 -and $teste2) {
    Write-Host "🎉 TODOS OS TESTES PASSARAM!" -ForegroundColor Green
    Write-Host "✅ Backend API funcionando perfeitamente" -ForegroundColor Green
    Write-Host "✅ Integração pronta para uso" -ForegroundColor Green
} else {
    Write-Host "⚠️ ALGUNS TESTES FALHARAM" -ForegroundColor Yellow
    Write-Host "❌ Verificar configuração da API" -ForegroundColor Red
}

Write-Host "`n🌐 URLs para teste manual:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:4200/" -ForegroundColor White
Write-Host "Backend: $API_BASE" -ForegroundColor White

Write-Host "`n🚀 Teste concluído!" -ForegroundColor Cyan
