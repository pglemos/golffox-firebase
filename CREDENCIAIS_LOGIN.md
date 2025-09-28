# 🔐 CREDENCIAIS DE LOGIN - GOLFFOX

## 📱 APLICAÇÕES DISPONÍVEIS

### 🔧 PAINEL ADMINISTRATIVO
**URL:** https://golffox-app.web.app/admin/ ou http://localhost:3000/admin/

**Credenciais Válidas:**
- **Admin:** `admin@golffox.com` / `Admin123!@#`
- **Gestor:** `gestor@golffox.com` / `Gestor123!@#`
- **Operador:** `operador@golffox.com` / `operador123`

### 🚗 APP DO MOTORISTA
**URL:** http://localhost:3000 (selecionar "App do Motorista")

**Credenciais de Teste:**
- **Email:** `motorista@golffox.com`
- **Senha:** `motorista123`
- **Nome:** João Silva - Motorista
- **Função:** driver

### 👥 APP DO PASSAGEIRO  
**URL:** http://localhost:3000 (selecionar "App do Passageiro")

**Credenciais de Teste:**
- **Email:** `passageiro@golffox.com`
- **Senha:** `passageiro123` (verificar se existe)
- **Nome:** Carlos Oliveira - Passageiro
- **Função:** passenger

---

## 🔧 CREDENCIAIS ALTERNATIVAS (do arquivo constants.ts)

### 👨‍💼 FUNCIONÁRIOS/OPERADORES
```
Email: operador@jbs.com.br
Senha: operador123
```

### 👥 PASSAGEIROS MOCK
```
Email: fernanda.o@example.com
Senha: senha123

Email: ricardo.s@example.com  
Senha: senha456

Email: patricia.l@example.com
Senha: senha789
```

---

## ⚠️ PROBLEMA ATUAL

**Status:** ❌ API do Firestore não está habilitada

**Erro:** `PERMISSION_DENIED: Cloud Firestore API has not been used in project golffox-app`

### 🛠️ SOLUÇÃO NECESSÁRIA:

1. **Acessar Google Cloud Console:**
   - Ir para: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=golffox-app

2. **Habilitar API do Firestore:**
   - Clicar em "ENABLE" (Habilitar)
   - Aguardar alguns minutos para propagação

3. **Executar novamente o script:**
   ```bash
   node create-driver-passenger-users.js
   ```

---

## 📋 INSTRUÇÕES DE USO

### Para testar o APP DO MOTORISTA:
1. Abrir: http://localhost:3000
2. Clicar em "App do Motorista"
3. Fazer login com:
   - Email: `motorista@teste.com`
   - Senha: `motorista123`

### Para testar o APP DO PASSAGEIRO:
1. Abrir: http://localhost:3000
2. Clicar em "App do Passageiro"  
3. Fazer login com:
   - Email: `passageiro@teste.com`
   - Senha: `passageiro123`

---

## 📝 OBSERVAÇÕES

- As credenciais principais (`motorista@teste.com` e `passageiro@teste.com`) serão criadas automaticamente após habilitar a API do Firestore
- As credenciais alternativas do `constants.ts` podem não funcionar se os usuários não existirem no banco de dados
- Certifique-se de que o servidor de desenvolvimento está rodando (`npm run dev`)

---

**Última atualização:** 26/09/2024
**Status do projeto:** Desenvolvimento