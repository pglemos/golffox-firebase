# 🔄 Guia de Migração para Nova Conta Firebase

Este guia irá ajudá-lo a migrar o projeto GolfFox para uma nova conta do Firebase.

## 📋 Checklist de Migração

### 1. 🆕 Criar Novo Projeto Firebase

1. **Acesse o Firebase Console**
   - Vá para: https://console.firebase.google.com/
   - Faça login com sua nova conta Google

2. **Criar Novo Projeto**
   - Clique em "Adicionar projeto"
   - Nome sugerido: `golffox-production` ou `golffox-[sua-empresa]`
   - Escolha se deseja ativar Google Analytics (recomendado)
   - Clique em "Criar projeto"

### 2. ⚙️ Configurar Serviços Firebase

#### 2.1 Authentication
1. No console, vá para **Authentication** > **Get started**
2. Na aba **Sign-in method**, ative:
   - ✅ **Email/password** (necessário para o sistema)
3. Configure domínios autorizados se necessário

#### 2.2 Firestore Database
1. Vá para **Firestore Database** > **Create database**
2. Escolha **Start in production mode** (mais seguro)
3. Selecione a localização (recomendado: `southamerica-east1` para Brasil)
4. Clique em **Done**

#### 2.3 Storage (Opcional)
1. Vá para **Storage** > **Get started**
2. Aceite as regras padrão
3. Escolha a mesma localização do Firestore

### 3. 🔑 Gerar Credenciais

#### 3.1 Configuração Web (Frontend)
1. No console, vá para **Configurações do projeto** (ícone de engrenagem)
2. Na aba **Geral**, role até **Seus aplicativos**
3. Clique em **Adicionar app** > **Web** (ícone `</>`)
4. Nome do app: `GolfFox Web`
5. ✅ Marque "Configurar também o Firebase Hosting"
6. Clique em **Registrar app**
7. **COPIE** as configurações mostradas:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyABa2KHvh8r805Z0fqSwEWO_CsNC_YmIrg",
  authDomain: "golffox-app.firebaseapp.com",
  projectId: "golffox-app",
  storageBucket: "golffox-app.firebasestorage.app",
  messagingSenderId: "1091040438113",
  appId: "1:1091040438113:web:128fa17a81e547fb890720",
  measurementId: "G-1ZH2SZNKR1"
};
```

#### 3.2 Service Account (Backend)
1. Vá para **Configurações do projeto** > **Contas de serviço**
2. Clique em **Gerar nova chave privada**
3. Escolha **JSON** e clique em **Gerar chave**
4. **BAIXE** o arquivo JSON (mantenha seguro!)

### 4. 🔧 Atualizar Configurações do Projeto

#### 4.1 Atualizar .env.local
Substitua as seguintes variáveis com os valores do seu novo projeto:

```bash
# Configuração do Firebase (Cliente) - SUBSTITUA PELOS SEUS VALORES
NEXT_PUBLIC_FIREBASE_API_KEY=sua-nova-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-novo-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-novo-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-novo-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu-novo-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=seu-novo-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=seu-novo-measurement-id

# Configuração do Firebase Admin (servidor) - SUBSTITUA PELOS SEUS VALORES
FIREBASE_ADMIN_PROJECT_ID=seu-novo-projeto-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----"
```

#### 4.2 Atualizar .firebaserc
```json
{
  "projects": {
    "default": "seu-novo-projeto-id",
    "out": "seu-novo-projeto-id"
  },
  "targets": {},
  "etags": {}
}
```

### 5. 🔒 Configurar Regras de Segurança

#### 5.1 Firestore Rules
No console Firebase, vá para **Firestore Database** > **Regras** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Empresas - apenas usuários autenticados
    match /companies/{companyId} {
      allow read, write: if request.auth != null;
    }
    
    // Motoristas - apenas usuários autenticados
    match /drivers/{driverId} {
      allow read, write: if request.auth != null;
    }
    
    // Veículos - apenas usuários autenticados
    match /vehicles/{vehicleId} {
      allow read, write: if request.auth != null;
    }
    
    // Rotas - apenas usuários autenticados
    match /routes/{routeId} {
      allow read, write: if request.auth != null;
    }
    
    // Check-ins - apenas usuários autenticados
    match /checkins/{checkinId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### 5.2 Storage Rules (se configurado)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. 🧪 Testar Nova Configuração

1. **Parar o servidor atual** (se estiver rodando)
2. **Atualizar as configurações** conforme os passos acima
3. **Executar testes**:
   ```bash
   npm run dev
   node test-auth.js
   ```

### 7. 📊 Migrar Dados (Opcional)

Se você tem dados no projeto anterior que deseja migrar:

1. **Exportar dados do projeto antigo**
2. **Importar para o novo projeto**
3. **Verificar integridade dos dados**

### 8. 🚀 Deploy para Produção

Após confirmar que tudo funciona:

```bash
# Build do projeto
npm run build

# Deploy para Firebase Hosting
firebase deploy
```

## ⚠️ Pontos Importantes

- ✅ **Backup**: Sempre faça backup dos dados antes da migração
- ✅ **Teste**: Teste completamente antes de ir para produção
- ✅ **Segurança**: Nunca compartilhe suas chaves privadas
- ✅ **Domínios**: Configure domínios autorizados no Authentication
- ✅ **Billing**: Verifique os limites de uso do plano gratuito

## 🆘 Solução de Problemas

### Erro de Autenticação
- Verifique se as chaves estão corretas no `.env.local`
- Confirme se o Authentication está ativado no console

### Erro de Firestore
- Verifique se o Firestore foi criado
- Confirme as regras de segurança

### Erro de Deploy
- Verifique se o projeto ID está correto no `.firebaserc`
- Confirme se você tem permissões no projeto

---

**📞 Precisa de ajuda?** Verifique os logs do console ou execute os testes para identificar problemas específicos.