# 🔥 Configuração do Firebase Firestore

> **⚠️ OBRIGATÓRIO:** A persistência DEVE usar Cloud Firestore. Sem essa configuração, os dados serão perdidos ao reiniciar o servidor!

Este guia explica como configurar o Firebase Firestore para persistência de dados no backend.

## 📋 Pré-requisitos

1. Ter um projeto Firebase criado
2. Ter o Firestore habilitado no projeto
3. Ter permissões de administrador no projeto

## 🔧 Passo a Passo

### 1. Acessar Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `dexti-9fec6` (ou seu projeto)

### 2. Habilitar Firestore

1. No menu lateral, clique em **Firestore Database**
2. Se não estiver criado, clique em **Criar banco de dados**
3. Escolha o modo de produção
4. Selecione uma localização (ex: `us-central`)
5. Clique em **Habilitar**

### 3. Obter Service Account

1. No menu lateral, clique em **Configurações do projeto** (ícone de engrenagem)
2. Vá para a aba **Service accounts**
3. Clique em **Gerar nova chave privada**
4. Um arquivo JSON será baixado

### 4. Configurar no Backend

1. Abra o arquivo JSON baixado
2. Copie TODO o conteúdo do JSON
3. No arquivo `.env` do backend, cole na variável `FIREBASE_SERVICE_ACCOUNT`:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"dexti-9fec6","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

FIREBASE_PROJECT_ID=dexti-9fec6
```

**IMPORTANTE:**
- O JSON deve estar em UMA ÚNICA LINHA
- As quebras de linha na `private_key` devem ser `\\n` (duas barras + n)
- Não quebre o JSON em múltiplas linhas
- Mantenha todas as aspas e caracteres especiais
- Se tiver problemas, use `JSON.stringify()` no Node.js para gerar o formato correto

### 5. Verificar Configuração

Ao iniciar o backend, você deve ver:

```
🔍 Verificando configuração de persistência...
   FIREBASE_SERVICE_ACCOUNT: ✅ Configurado
   FIREBASE_PROJECT_ID: ✅ Configurado
🔧 Inicializando Firebase Admin...
📋 Project ID: dexti-9fec6
🔑 Service Account: Configurado
✅ Firebase Admin inicializado com Service Account
✅ Cloud Firestore inicializado com sucesso
   📍 Projeto: dexti-9fec6
   📦 Coleção: rooms
📦 ✅ Usando Firestore para persistência (Cloud Firestore)
   Os dados serão salvos permanentemente no Firebase
```

## 🧪 Testar

1. Inicie o backend: `pnpm start:dev`
2. Crie uma sala via API
3. Verifique no Firebase Console → Firestore Database
4. Você deve ver a coleção `rooms` com os documentos

## ⚠️ Troubleshooting

### Erro: "Firebase não inicializado"
- Verifique se `FIREBASE_SERVICE_ACCOUNT` está configurado corretamente
- Verifique se o JSON está em uma única linha
- Verifique se não há caracteres especiais quebrados

### Erro: "Permission denied"
- Verifique se o Firestore está habilitado
- Verifique se as regras do Firestore permitem escrita
- Para desenvolvimento, você pode usar regras temporárias:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Dados não aparecem no Firestore
- Verifique os logs do backend para erros
- Verifique se está usando o repositório Firestore (veja logs na inicialização)
- Verifique se a coleção `rooms` foi criada

## 📝 Estrutura dos Dados

As salas são salvas na coleção `rooms` com:
- **Document ID**: Código da sala (ex: `ABC123`)
- **Campos**: Todos os dados da sala, incluindo jogo e cartelas

## 🔒 Segurança

**ATENÇÃO:** As regras acima são apenas para desenvolvimento. Para produção, configure regras adequadas de segurança no Firestore.

