# 🚀 Solução Rápida - Credenciais AWS

## 🎯 **Problema Identificado**

-  ✅ AWS CLI funcionando (v2.29.1)
-  ✅ Conectividade OK
-  ✅ Configuração correta
-  ❌ **Secret Access Key incorreta/expirada**

## 🔧 **Solução em 3 Passos**

### **Passo 1: Criar Nova Access Key**

1. **Acesse**: https://console.aws.amazon.com/iam/
2. **Navegue**: Users → Seu usuário → Security credentials
3. **Clique**: Create access key
4. **Escolha**: "Application running outside AWS"
5. **Copie**: Access Key ID e Secret Access Key

### **Passo 2: Reconfigurar AWS CLI**

```powershell
# Limpar configuração atual
Remove-Item -Path "$env:USERPROFILE\.aws" -Recurse -Force

# Reconfigurar com novas credenciais
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" configure
```

### **Passo 3: Testar**

```powershell
# Testar credenciais
& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" sts get-caller-identity
```

## 🎯 **Resultado Esperado**

```json
{
   "UserId": "AIDACKCEVSQ6C2EXAMPLE",
   "Account": "123456789012",
   "Arn": "arn:aws:iam::123456789012:user/YourUserName"
}
```

## 🚀 **Próximo Passo**

Após resolver as credenciais:

```powershell
.\EXECUTAR-COMANDOS-AWS.ps1
```

## 📋 **Checklist**

-  [ ] Nova Access Key criada
-  [ ] AWS CLI reconfigurado
-  [ ] Credenciais testadas com sucesso
-  [ ] Script de deploy executado

---

**Tempo estimado: 5 minutos** ⏱️
