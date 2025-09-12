# 🔧 Resolver Erro de Credenciais AWS

## 🚨 Problema Atual

```
SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided
```

## 🔍 Possíveis Causas

### 1. **Secret Access Key Incorreta**

-  Caracteres especiais não copiados corretamente
-  Espaços extras no início/fim
-  Caracteres ocultos

### 2. **Access Key Expirada ou Inválida**

-  Access Key foi desabilitada
-  Access Key expirou
-  Access Key foi deletada

### 3. **Permissões Insuficientes**

-  Usuário não tem permissões para STS
-  Políticas muito restritivas

## 🛠️ Soluções

### **Solução 1: Criar Nova Access Key**

1. **Acesse AWS Console**:

   -  https://console.aws.amazon.com/iam/

2. **Navegue para Users**:

   -  IAM → Users → Seu usuário

3. **Security credentials**:

   -  Clique em "Security credentials"
   -  Role até "Access keys"

4. **Criar nova chave**:

   -  Clique em "Create access key"
   -  Escolha "Application running outside AWS"
   -  Clique em "Next"
   -  Adicione uma tag (opcional)
   -  Clique em "Create access key"

5. **Copiar credenciais**:
   -  **IMPORTANTE**: Copie imediatamente
   -  A Secret Access Key só é mostrada uma vez

### **Solução 2: Verificar Permissões**

Adicione estas políticas ao seu usuário:

```json
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Effect": "Allow",
         "Action": [
            "sts:GetCallerIdentity",
            "ec2:*",
            "rds:*",
            "lambda:*",
            "iam:*",
            "cloudformation:*",
            "apigateway:*",
            "logs:*"
         ],
         "Resource": "*"
      }
   ]
}
```

### **Solução 3: Reconfigurar AWS CLI**

```powershell
# Limpar configuração atual
Remove-Item -Path "$env:USERPROFILE\.aws" -Recurse -Force

# Reconfigurar
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" configure
```

### **Solução 4: Usar Variáveis de Ambiente**

```powershell
# Definir variáveis de ambiente
$env:AWS_ACCESS_KEY_ID = "AKIAVKDRCPYCL5BGY7P4"
$env:AWS_SECRET_ACCESS_KEY = "sua-nova-secret-key"
$env:AWS_DEFAULT_REGION = "sa-east-1"

# Testar
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" sts get-caller-identity
```

## 🧪 Teste Rápido

### **Teste 1: Verificar Access Key**

```bash
# Verificar se a Access Key existe
aws iam get-access-key-last-used --access-key-id AKIAVKDRCPYCL5BGY7P4
```

### **Teste 2: Verificar Usuário**

```bash
# Verificar informações do usuário
aws iam get-user
```

### **Teste 3: Verificar Permissões**

```bash
# Verificar políticas anexadas
aws iam list-attached-user-policies --user-name SEU-USUARIO
```

## 🎯 Passos Recomendados

1. **Criar nova Access Key** (mais seguro)
2. **Verificar permissões** do usuário
3. **Reconfigurar AWS CLI** com novas credenciais
4. **Testar** com `aws sts get-caller-identity`

## 📞 Suporte Adicional

Se o problema persistir:

1. **Verifique a região**: Certifique-se de que está usando `sa-east-1`
2. **Verifique o fuso horário**: AWS é sensível a diferenças de horário
3. **Verifique a conectividade**: Teste com `ping aws.amazon.com`
4. **Verifique o firewall**: Certifique-se de que não está bloqueando HTTPS

## 🔐 Segurança

-  **Nunca compartilhe** suas credenciais
-  **Delete Access Keys** antigas quando não precisar mais
-  **Use IAM Roles** quando possível (mais seguro)
-  **Rotacione credenciais** regularmente

---

**Após resolver, execute: `.\EXECUTAR-COMANDOS-AWS.ps1`** 🚀
