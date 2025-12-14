# 🚀 Bingo Certo - Backend

> API REST e WebSocket para sistema de bingo online

[![NestJS](https://img.shields.io/badge/NestJS-10.3-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 📋 Sobre

Backend desenvolvido com **NestJS** seguindo **Clean Architecture**. Fornece API REST para gerenciamento de salas e WebSocket para comunicação em tempo real durante os jogos.

## 🚀 Instalação

```bash
# Instalar dependências
pnpm install

# Ou com npm
npm install
```

## ⚙️ Configuração

### 1. Copiar arquivo de ambiente

```bash
# Criar arquivo .env baseado no exemplo
cp env.example.txt .env
# Ou criar manualmente o arquivo .env
```

### 2. Configurar variáveis

Edite o arquivo `.env`:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000

# Firebase Firestore (OBRIGATÓRIO para persistência)
FIREBASE_PROJECT_ID=dexti-9fec6
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**⚠️ IMPORTANTE:** A persistência DEVE usar Cloud Firestore. Sem essas variáveis, os dados serão perdidos ao reiniciar o servidor!

Para configurar o Firebase:

1. Ir em [Firebase Console](https://console.firebase.google.com/)
2. Selecionar o projeto `dexti-9fec6`
3. Ir em **Project Settings** → **Service accounts**
4. Gerar nova chave privada
5. Copiar o JSON completo e colar em `FIREBASE_SERVICE_ACCOUNT` (em uma única linha)

## 🏃 Como Rodar

### Desenvolvimento

```bash
pnpm start:dev
```

O servidor inicia em: **http://localhost:3001**

### Produção

```bash
# Build
pnpm build

# Iniciar
pnpm start:prod
```

## 🏗️ Arquitetura

```
src/
├── domain/                    # Camada de Domínio (Clean Architecture)
│   ├── entities/              # Entidades de negócio
│   │   ├── Room.ts           # Entidade Sala
│   │   ├── Game.ts           # Entidade Jogo
│   │   └── Card.ts           # Entidade Cartela
│   ├── repositories/          # Interfaces de repositório
│   │   └── room.repository.interface.ts
│   └── services/              # Serviços de domínio
│       └── room.service.ts   # Lógica de negócio
│
├── rooms/                     # Módulo de Salas
│   ├── dto/                   # Data Transfer Objects
│   ├── repositories/          # Implementações
│   ├── rooms.controller.ts   # Controller REST
│   ├── rooms.service.ts      # Service do módulo
│   └── rooms.module.ts       # Módulo NestJS
│
├── game/                      # Módulo de Jogo
│   ├── game.controller.ts
│   ├── game.service.ts
│   └── game.module.ts
│
├── app.gateway.ts             # WebSocket Gateway
├── app.module.ts              # Módulo raiz
└── main.ts                    # Entry point
```

## 📡 Endpoints da API

### Salas

#### Criar Sala
```http
POST /rooms
Content-Type: application/json

{
  "name": "Bingo da Família",
  "hostId": "user-123",
  "hostName": "João",
  "maxCards": 10,
  "rules": ["line", "column", "full"]
}
```

#### Buscar Sala
```http
GET /rooms/:code
```

#### Entrar na Sala
```http
POST /rooms/join
Content-Type: application/json

{
  "roomCode": "ABC123",
  "visitorId": "visitor-456",
  "nickname": "Maria"
}
```

#### Iniciar Jogo
```http
POST /rooms/:code/start
Content-Type: application/json

{
  "hostId": "user-123"
}
```

### Jogo

#### Sortear Número
```http
POST /game/:roomCode/draw
Content-Type: application/json

{
  "hostId": "user-123"
}
```

#### Validar Bingo
```http
POST /game/:roomCode/validate-bingo
Content-Type: application/json

{
  "cardId": "card-789",
  "visitorId": "visitor-456"
}
```

## 🔌 WebSocket Events

### Cliente → Servidor

```javascript
// Entrar na sala
socket.emit('join-room', {
  roomCode: 'ABC123',
  visitorId: 'visitor-456'
});

// Sair da sala
socket.emit('leave-room', {
  roomCode: 'ABC123'
});
```

### Servidor → Cliente

```javascript
// Número sorteado
socket.on('number-drawn', (data) => {
  console.log('Número:', data.number);
  console.log('Números sorteados:', data.drawnNumbers);
});

// Bingo válido
socket.on('bingo-won', (data) => {
  console.log('Vencedor:', data.winnerName);
});

// Bingo inválido
socket.on('bingo-invalid', (data) => {
  console.log('Bingo inválido');
});
```

## 🧪 Testes

```bash
# Rodar testes
pnpm test

# Testes em watch mode
pnpm test:watch

# Cobertura
pnpm test:cov
```

## 📦 Dependências Principais

- `@nestjs/common` - Framework NestJS
- `@nestjs/websockets` - WebSocket support
- `socket.io` - WebSocket library
- `class-validator` - Validação de DTOs
- `firebase-admin` - Firebase Admin SDK (opcional)

## 🏗️ Clean Architecture

### Domain Layer
Contém as **entidades** e **regras de negócio puras**, sem dependências de frameworks.

### Application Layer
Módulos NestJS que orquestram o domínio.

### Infrastructure Layer
Implementações concretas (repositórios, APIs externas).

## 📝 Licença

MIT

---

**Backend desenvolvido com NestJS e Clean Architecture**
