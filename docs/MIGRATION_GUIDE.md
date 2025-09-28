# Guia de Migração: Supabase → Firebase

Este documento descreve o processo completo de migração do sistema GolfFox do Supabase para o Firebase.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Configuração do Firebase](#configuração-do-firebase)
4. [Migração dos Dados](#migração-dos-dados)
5. [Alterações no Código](#alterações-no-código)
6. [Deploy e Configuração](#deploy-e-configuração)
7. [Testes](#testes)
8. [Rollback](#rollback)
9. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

### O que foi migrado:
- **Autenticação**: Supabase Auth → Firebase Auth
- **Banco de dados**: PostgreSQL (Supabase) → Firestore (Firebase)
- **Storage**: Supabase Storage → Firebase Storage
- **Real-time**: Supabase Realtime → Firestore Real-time listeners
- **Notificações**: Sistema customizado → Firebase Cloud Messaging (FCM)

### Benefícios da migração:
- ✅ Melhor integração com Google Cloud Platform
- ✅ Notificações push nativas
- ✅ Escalabilidade automática
- ✅ Regras de segurança mais robustas
- ✅ Melhor performance global

## 🔧 Pré-requisitos

### Ferramentas necessárias:
```bash
# Node.js 18+
node --version

# Firebase CLI
npm install -g firebase-tools

# Git
git --version
```

### Contas necessárias:
- Conta Google/Firebase
- Acesso ao projeto Supabase (para exportar dados)
- Chaves de API do Google Maps (se aplicável)

## 🚀 Configuração do Firebase

### 1. Criar projeto Firebase
```bash
# Login no Firebase
firebase login

# Criar novo projeto
firebase projects:create golffox-production

# Selecionar projeto
firebase use golffox-production
```

### 2. Habilitar serviços
```bash
# Habilitar Authentication
firebase auth:enable

# Habilitar Firestore
firebase firestore:enable

# Habilitar Storage
firebase storage:enable

# Habilitar Cloud Messaging
firebase messaging:enable
```

### 3. Configurar variáveis de ambiente
Copie `.env.example` para `.env.local` e configure:

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# FCM
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

## 📊 Migração dos Dados

### 1. Exportar dados do Supabase
```sql
-- Exportar usuários
COPY (SELECT * FROM users) TO '/tmp/users.csv' WITH CSV HEADER;

-- Exportar empresas
COPY (SELECT * FROM companies) TO '/tmp/companies.csv' WITH CSV HEADER;

-- Exportar motoristas
COPY (SELECT * FROM drivers) TO '/tmp/drivers.csv' WITH CSV HEADER;

-- Exportar veículos
COPY (SELECT * FROM vehicles) TO '/tmp/vehicles.csv' WITH CSV HEADER;

-- Exportar rotas
COPY (SELECT * FROM routes) TO '/tmp/routes.csv' WITH CSV HEADER;

-- Exportar passageiros
COPY (SELECT * FROM passengers) TO '/tmp/passengers.csv' WITH CSV HEADER;
```

### 2. Transformar dados para Firestore
Use o script `scripts/populate-database.js` para importar os dados:

```bash
npm run populate-db
```

### 3. Verificar migração
```bash
# Verificar coleções criadas
firebase firestore:collections

# Verificar documentos
firebase firestore:get users
```

## 🔄 Alterações no Código

### Serviços migrados:
- ✅ `authService.ts` - Autenticação
- ✅ `driversService.ts` - Gestão de motoristas
- ✅ `vehiclesService.ts` - Gestão de veículos
- ✅ `routeService.ts` - Gestão de rotas
- ✅ `passengersService.ts` - Gestão de passageiros
- ✅ `alertsService.ts` - Sistema de alertas
- ✅ `companiesService.ts` - Gestão de empresas
- ✅ `analyticsService.ts` - Analytics e relatórios
- ✅ `driverVehicleService.ts` - Atribuições
- ✅ `vehicleTrackingService.ts` - Rastreamento

### APIs atualizadas:
- ✅ `/api/auth/login` - Login com Firebase Auth
- ✅ `/api/auth/register` - Registro com Firebase Auth
- ✅ `/api/vehicles/[id]` - CRUD de veículos
- ✅ `middleware.ts` - Autenticação de rotas

### Arquivos removidos:
- ❌ `lib/supabase.ts`
- ❌ `lib/supabase-server.ts`
- ❌ `scripts/verify-supabase.ts`
- ❌ `scripts/create-database.ts`
- ❌ `scripts/setup-project.ts`

## 🚀 Deploy e Configuração

### 1. Deploy das regras de segurança
```bash
# Deploy regras Firestore
firebase deploy --only firestore:rules

# Deploy regras Storage
firebase deploy --only storage
```

### 2. Deploy da aplicação
```bash
# Build da aplicação
npm run build

# Export estático
npm run export

# Deploy hosting
firebase deploy --only hosting
```

### 3. Configurar FCM
```bash
# Gerar chave VAPID
firebase messaging:generate-vapid-key

# Configurar no .env
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_generated_key
```

## 🧪 Testes

### 1. Testes de autenticação
```bash
# Testar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Testar registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"password123","name":"Test User"}'
```

### 2. Testes de CRUD
```bash
# Testar listagem de veículos
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/vehicles

# Testar criação de motorista
curl -X POST http://localhost:3000/api/drivers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Driver","license":"ABC123"}'
```

### 3. Testes de notificações
```javascript
// Testar FCM no console do navegador
import { requestNotificationPermission } from './lib/fcm';
const token = await requestNotificationPermission();
console.log('FCM Token:', token);
```

## 🔄 Rollback

### Em caso de problemas, siga estes passos:

### 1. Rollback do código
```bash
# Voltar para commit anterior
git revert HEAD

# Ou resetar para versão estável
git reset --hard COMMIT_HASH
```

### 2. Restaurar Supabase
```bash
# Reinstalar dependências Supabase
npm install @supabase/supabase-js

# Restaurar arquivos de configuração
git checkout HEAD~1 -- lib/supabase.ts
git checkout HEAD~1 -- lib/supabase-server.ts
```

### 3. Reconfigurar variáveis
```env
# Restaurar variáveis Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 4. Deploy da versão anterior
```bash
npm run build
npm run deploy
```

## 🔧 Troubleshooting

### Problemas comuns:

#### 1. Erro de autenticação
```
Error: Firebase Auth token invalid
```
**Solução**: Verificar configuração das chaves Firebase e regenerar tokens.

#### 2. Regras Firestore negando acesso
```
Error: Missing or insufficient permissions
```
**Solução**: Verificar regras em `firestore.rules` e estrutura dos documentos.

#### 3. FCM não funcionando
```
Error: Messaging service not available
```
**Solução**: Verificar chave VAPID e configuração do service worker.

#### 4. Performance lenta
```
Warning: Large number of reads
```
**Solução**: Otimizar queries e implementar cache local.

### Logs úteis:
```bash
# Logs Firebase Functions
firebase functions:log

# Logs Firestore
firebase firestore:logs

# Logs aplicação
npm run dev -- --debug
```

## 📞 Suporte

### Contatos:
- **Desenvolvedor**: [Seu email]
- **Firebase Support**: https://firebase.google.com/support
- **Documentação**: https://firebase.google.com/docs

### Recursos úteis:
- [Firebase Console](https://console.firebase.google.com)
- [Firestore Rules Playground](https://firebase.google.com/docs/rules/simulator)
- [FCM Testing](https://firebase.google.com/docs/cloud-messaging/js/client)

---

**Data da migração**: Janeiro 2025  
**Versão**: 2.0.0  
**Status**: ✅ Concluída