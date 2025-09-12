# Script para verificar permissões AWS e criar nova Access Key
# Este script te ajuda a verificar se o usuário tem as permissões necessárias

$AwsCliPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"

Write-Host "🔍 Verificar Permissões AWS" -ForegroundColor Blue
Write-Host "===========================" -ForegroundColor Blue
Write-Host ""

Write-Host "📋 PROBLEMA IDENTIFICADO:" -ForegroundColor Red
Write-Host "A Secret Access Key está incorreta ou expirada" -ForegroundColor Red
Write-Host ""

Write-Host "🔧 SOLUÇÃO:" -ForegroundColor Yellow
Write-Host "Você precisa criar uma NOVA Access Key no AWS Console" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 PASSO A PASSO:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. 🌐 Abrir AWS Console:" -ForegroundColor Green
Write-Host "   https://console.aws.amazon.com/iam/" -ForegroundColor Yellow
Write-Host ""

Write-Host "2. 👤 Navegar para seu usuário:" -ForegroundColor Green
Write-Host "   - Clique em 'Users' no menu lateral" -ForegroundColor White
Write-Host "   - Clique no seu usuário" -ForegroundColor White
Write-Host "   - Clique na aba 'Security credentials'" -ForegroundColor White
Write-Host ""

Write-Host "3. 🔑 Criar nova Access Key:" -ForegroundColor Green
Write-Host "   - Role até 'Access keys'" -ForegroundColor White
Write-Host "   - Clique em 'Create access key'" -ForegroundColor White
Write-Host "   - Escolha 'Application running outside AWS'" -ForegroundColor White
Write-Host "   - Clique em 'Next' e depois 'Create access key'" -ForegroundColor White
Write-Host ""

Write-Host "4. 📋 Copiar credenciais:" -ForegroundColor Green
Write-Host "   - Copie o 'Access key ID'" -ForegroundColor White
Write-Host "   - Copie o 'Secret access key'" -ForegroundColor White
Write-Host "   - ⚠️  IMPORTANTE: A Secret Access Key só é mostrada uma vez!" -ForegroundColor Red
Write-Host ""

Write-Host "5. 🗑️  Deletar Access Key antiga:" -ForegroundColor Green
Write-Host "   - Na lista de Access Keys, clique em 'Delete' na chave antiga" -ForegroundColor White
Write-Host "   - Confirme a exclusão" -ForegroundColor White
Write-Host ""

Write-Host "6. ⚙️  Reconfigurar AWS CLI:" -ForegroundColor Green
Write-Host "   - Execute: .\CONFIGURAR-AWS-CLI.ps1" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 PERMISSÕES NECESSÁRIAS:" -ForegroundColor Cyan
Write-Host "Seu usuário precisa das seguintes permissões:" -ForegroundColor White
Write-Host "- EC2FullAccess (para Security Groups)" -ForegroundColor Yellow
Write-Host "- RDSReadOnlyAccess (para RDS)" -ForegroundColor Yellow
Write-Host "- LambdaFullAccess (para Lambda)" -ForegroundColor Yellow
Write-Host "- IAMFullAccess (para IAM)" -ForegroundColor Yellow
Write-Host "- CloudFormationFullAccess (para CloudFormation)" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔍 VERIFICAR PERMISSÕES:" -ForegroundColor Cyan
Write-Host "1. No AWS Console, vá em IAM > Users > Seu usuário" -ForegroundColor White
Write-Host "2. Clique na aba 'Permissions'" -ForegroundColor White
Write-Host "3. Verifique se tem as políticas listadas acima" -ForegroundColor White
Write-Host ""

Write-Host "📞 SE NÃO TIVER PERMISSÕES:" -ForegroundColor Red
Write-Host "1. Entre em contato com o administrador da conta AWS" -ForegroundColor White
Write-Host "2. Solicite as permissões necessárias" -ForegroundColor White
Write-Host "3. Ou use uma conta com permissões administrativas" -ForegroundColor White
Write-Host ""

Write-Host "🎯 PRÓXIMO PASSO:" -ForegroundColor Yellow
Write-Host "Após criar a nova Access Key, execute:" -ForegroundColor White
Write-Host ".\CONFIGURAR-AWS-CLI.ps1" -ForegroundColor Yellow
Write-Host ""

Write-Host "Pressione ENTER quando tiver criado a nova Access Key..." -ForegroundColor Cyan
Read-Host
