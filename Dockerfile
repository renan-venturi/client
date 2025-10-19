# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-slim AS base

# Instalar dependências necessárias
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
FROM base AS deps
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Build da aplicação
FROM base AS builder
COPY . .
RUN npm install --legacy-peer-deps
RUN npx prisma generate
RUN npm run build

# Imagem de produção
FROM base AS runner
WORKDIR /app

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copiar arquivos necessários
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Copiar Prisma Client gerado
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Configurar permissões
RUN chown -R nestjs:nodejs /app
USER nestjs

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar
CMD ["node", "dist/src/main.js"]
