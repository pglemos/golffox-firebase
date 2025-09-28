# 🔑 PASSO 5 DETALHADO - COLETAR CREDENCIAIS

## 📍 ONDE ENCONTRAR CADA INFORMAÇÃO

### 🌐 **PARTE 1: Configurações Web (5 informações)**

**No Console Firebase:**
1. Clique em **⚙️ Project Settings** (ícone de engrenagem no canto superior esquerdo)
2. Role para baixo até **"Your apps"**
3. Clique no ícone **`</>`** (Web app)
4. Você verá um código JavaScript como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",           // ← COPIE ESTE
  authDomain: "projeto.firebaseapp.com",  // ← COPIE ESTE
  projectId: "meu-projeto",       // ← COPIE ESTE
  storageBucket: "projeto.appspot.com",   // ← COPIE ESTE
  messagingSenderId: "123456789", // ← COPIE ESTE
  appId: "1:123:web:abc123",      // ← COPIE ESTE
  measurementId: "G-ABC123"       // ← COPIE ESTE (opcional)
};
```

---

### 🔐 **PARTE 2: Service Account (2 informações)**

**No Console Firebase:**
1. Ainda em **⚙️ Project Settings**
2. Clique na aba **"Service accounts"**
3. Clique em **"Generate new private key"**
4. Baixe o arquivo JSON
5. Abra o arquivo JSON e encontre:

```json
{
  "client_email": "firebase-adminsdk-abc@projeto.iam.gserviceaccount.com",  // ← COPIE ESTE
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"  // ← COPIE ESTE
}
```

---

### 📱 **PARTE 3: FCM VAPID Key (1 informação - OPCIONAL)**

**No Console Firebase:**
1. **Project Settings** → **Cloud Messaging**
2. Role até **"Web configuration"**
3. Copie a **"Key pair"** (se existir)

---

## 🚀 **MÉTODO FÁCIL: Script Automático**

Execute este comando e siga as instruções:

```bash
node collect-firebase-credentials.js
```

O script vai perguntar uma por uma e salvar tudo automaticamente!

---

## 📝 **MÉTODO MANUAL: Editar .env.local**

Se preferir fazer manualmente, edite o arquivo `.env.local`:

```env
# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=meu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABC123

# Firebase Admin SDK
FIREBASE_PROJECT_ID=meu-projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc@projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# FCM (Opcional)
NEXT_PUBLIC_FCM_VAPID_KEY=sua-vapid-key
```

---

## ❓ **DÚVIDAS COMUNS:**

**Q: Onde está o Project Settings?**
A: Ícone de engrenagem ⚙️ no canto superior esquerdo do Console Firebase

**Q: Não vejo "Your apps"?**
A: Role para baixo na página Project Settings

**Q: O que é Service Account?**
A: São as credenciais para o servidor se conectar ao Firebase

**Q: Preciso do FCM VAPID Key?**
A: Não é obrigatório, pode pular se não tiver

---

## 🆘 **SE TIVER DIFICULDADE:**

1. **Tire um print** da tela onde está com dúvida
2. **Me mostre** e eu te ajudo a encontrar
3. **Ou execute:** `node collect-firebase-credentials.js` e siga o passo a passo

**Qual método prefere? Script automático ou manual?**