# 🏦 Loomi Client - Microsserviço

Microsserviço de gerenciamento de clientes da plataforma Loomi, construído com NestJS, TypeScript, Prisma e PostgreSQL.

## ✨ Funcionalidades

- ✅ **CRUD completo de clientes** - Criar, listar, buscar, atualizar e excluir clientes
- ✅ **Sistema de autenticação** - Registro e login com JWT
- ✅ **Cache Redis** - Cache inteligente para consultas frequentes
- ✅ **Validação robusta** - Validação de dados com class-validator
- ✅ **Health checks** - Monitoramento de saúde da aplicação
- ✅ **API RESTful** - Endpoints padronizados e documentados
- ✅ **Testes unitários** - 98 testes com cobertura completa
- ✅ **Logs estruturados** - Logging em inglês com métricas de performance
- ✅ **Segurança** - Helmet, CORS, rate limiting e validação de entrada

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
- **@nestjs/common**: ^10.3.0 - Framework base
- **@nestjs/core**: ^10.3.0 - Core do NestJS
- **@nestjs/platform-express**: ^10.3.0 - Servidor HTTP
- **@nestjs/config**: ^3.1.1 - Gerenciamento de configurações
- **@nestjs/swagger**: ^7.1.17 - Documentação automática da API
- **@nestjs/jwt**: ^10.2.0 - Autenticação JWT
- **@nestjs/passport**: ^10.0.3 - Estratégias de autenticação
- **@nestjs/throttler**: ^5.1.1 - Rate limiting
- **@prisma/client**: ^5.19.1 - ORM para banco de dados
- **redis**: ^4.6.0 - Cache Redis
- **bcrypt**: ^5.1.1 - Hash de senhas
- **passport-jwt**: ^4.0.1 - Estratégia JWT

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
- **Health Check**: http://localhost:3000/api/health

### 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Para acessar endpoints protegidos:

1. **Registre-se** ou **faça login** para obter um token
2. **Inclua o token** no header `Authorization: Bearer <token>`

### 📊 Métricas e Logs

O serviço possui logs estruturados em inglês com métricas de performance:
- **Duração das operações** - Tempo de resposta em milissegundos
- **Cache hits/misses** - Eficiência do cache Redis
- **IDs de correlação** - Rastreamento de requisições
- **Logs de erro** - Detalhamento de falhas

## 🚀 Endpoints da API

### Health Check
- `GET /api/health` - Status da aplicação
- `GET /api/health/ready` - Verificação de prontidão

### Autenticação
- `POST /api/auth/register` - Registrar novo cliente
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/profile` - Obter perfil do usuário autenticado (requer token JWT)

### Clientes
- `POST /api/clients` - Criar cliente
- `GET /api/clients` - Listar todos os clientes (com filtros)
- `GET /api/clients/:id` - Buscar cliente por ID (com cache Redis)
- `PATCH /api/clients/:id` - Atualizar cliente
- `DELETE /api/clients/:id` - Excluir cliente
- `GET /api/clients/filter?name=...` - Filtrar clientes por nome
- `GET /api/clients?email=...` - Filtrar clientes por email
- `PATCH /api/clients/:id/profile-picture` - Atualizar foto de perfil
- `POST /api/clients/:id/balance/add` - Adicionar saldo
- `POST /api/clients/:id/balance/subtract` - Subtrair saldo
- `GET /api/clients/:id/balance` - Consultar saldo

### Exemplos de Uso

#### Registrar Cliente
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "bankingAgency": "1234",
    "bankingAccount": "56789-0"
  }'
```

#### Fazer Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@example.com",
    "password": "senha123"
  }'
```

#### Obter Perfil (com token JWT)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer SEU_TOKEN_JWT_AQUI"
```

#### Criar Cliente
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@example.com",
    "password": "senha123",
    "phone": "+5511999999999",
    "address": "Rua das Flores, 123",
    "bankingAgency": "1234",
    "bankingAccount": "56789-0"
  }'
```

#### Listar Clientes
```bash
curl http://localhost:3000/api/clients
```

#### Filtrar por Nome
```bash
curl "http://localhost:3000/api/clients/filter?name=João"
```

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

O projeto possui **98 testes unitários** com cobertura completa:

```bash
# Testes unitários (98 testes)
npm run test

# Testes e2e
npm run test:e2e

# Cobertura de testes
npm run test:cov
```

### 📊 Cobertura de Testes

- **ClientService**: 25 testes (CRUD, cache Redis, validações)
- **ClientController**: 32 testes (endpoints, autenticação, filtros)
- **AuthService**: 16 testes (registro, login, validação)
- **AuthController**: 13 testes (autenticação, perfil, validação)
- **Edge cases**: Cenários de erro e validações
- **Mocks**: Prisma, Redis, JWT, bcrypt

### 🎯 Cenários Testados

- ✅ **Sucesso** - Operações bem-sucedidas
- ✅ **Erro** - Tratamento de exceções
- ✅ **Validação** - Dados inválidos
- ✅ **Autenticação** - JWT e permissões
- ✅ **Cache** - Redis hits/misses
- ✅ **Edge cases** - Cenários extremos

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
