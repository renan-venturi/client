# Loomi Client - Microsserviço

Microsserviço de gerenciamento de clientes da plataforma Loomi.

## 🚀 Tecnologias e Versões

### Core Technologies
- **Node.js**: 20.17.0 LTS
- **NPM**: 10.5.0
- **TypeScript**: 5.4.5

### Framework e Bibliotecas
- **NestJS**: 10.3.0
- **Prisma**: 5.19.1
- **PostgreSQL**: 15

### Dependências Principais
- **@nestjs/common**: ^10.3.0
- **@nestjs/core**: ^10.3.0
- **@nestjs/platform-express**: ^10.3.0
- **@nestjs/config**: ^3.1.1
- **@nestjs/swagger**: ^7.1.17
- **@nestjs/jwt**: ^10.2.0
- **@nestjs/passport**: ^10.0.3
- **@nestjs/throttler**: ^5.1.1
- **@prisma/client**: ^5.19.1

### Dependências de Desenvolvimento
- **@nestjs/cli**: ^10.2.1
- **@nestjs/schematics**: ^10.0.3
- **@nestjs/testing**: ^10.3.0
- **typescript**: ^5.4.5
- **prisma**: ^5.19.1
- **eslint**: ^8.54.0
- **prettier**: ^3.1.0
- **jest**: ^29.7.0

## 📋 Pré-requisitos

- Node.js 20.17.0 LTS
- NPM 10.5.0
- PostgreSQL 15 (local ou remoto)

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd client
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Configure o banco de dados PostgreSQL**
   - Crie um banco chamado `loomi_client`
   - Configure a string de conexão no arquivo `.env`

5. **Execute as migrações do Prisma**
   ```bash
   npm run prisma:migrate
   ```

6. **Execute o seed (opcional)**
   ```bash
   npm run prisma:seed
   ```

## 🚀 Executando a aplicação

### Desenvolvimento
```bash
npm run start:dev
```

### Produção
```bash
npm run build
npm run start:prod
```

## 📚 Documentação da API

Após iniciar a aplicação, acesse:
- **Swagger UI**: http://localhost:3000/api/docs

## 🗄️ Banco de dados

### Comandos do Prisma

```bash
# Gerar o cliente Prisma
npm run prisma:generate

# Criar uma nova migração
npm run prisma:migrate

# Aplicar migrações em produção
npm run prisma:deploy

# Abrir o Prisma Studio
npm run prisma:studio

# Executar seed
npm run prisma:seed
```

## 🧪 Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

## 📁 Estrutura do projeto

```
src/
├── common/           # Utilitários compartilhados
│   ├── decorators/  # Decorators customizados
│   ├── dto/         # Data Transfer Objects
│   ├── guards/      # Guards de autenticação/autorização
│   ├── interceptors/# Interceptors
│   ├── pipes/       # Pipes de validação
│   ├── filters/     # Exception filters
│   ├── utils/       # Funções utilitárias
│   └── prisma/      # Configuração do Prisma
├── modules/         # Módulos da aplicação
│   ├── auth/        # Autenticação
│   ├── client/      # Gerenciamento de clientes
│   └── health/      # Health checks
├── config/          # Configurações
├── app.module.ts    # Módulo principal
└── main.ts          # Ponto de entrada
```

## 🔧 Scripts disponíveis

- `npm run build` - Compila a aplicação
- `npm run start` - Inicia a aplicação
- `npm run start:dev` - Inicia em modo desenvolvimento
- `npm run start:debug` - Inicia em modo debug
- `npm run start:prod` - Inicia em modo produção
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes
- `npm run format` - Formata o código

## 🗄️ Banco de Dados

### Configuração do PostgreSQL

1. **Instale o PostgreSQL 15** (se ainda não tiver)
2. **Crie o banco de dados:**
   ```sql
   CREATE DATABASE loomi_client;
   ```
3. **Configure a string de conexão no `.env`:**
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/loomi_client?schema=public"
   ```
