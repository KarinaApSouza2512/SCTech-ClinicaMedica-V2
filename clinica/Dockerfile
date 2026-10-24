# Etapa de build: instala tudo (inclusive dev) e compila o TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

# Copia so o manifesto primeiro para aproveitar o cache do npm ci
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Etapa de execucao: so dependencias de producao e o codigo compilado
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
# --omit=optional: o typeorm declara ts-node/typescript como peer opcional,
# que o --omit=dev sozinho nao remove
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Nao roda como root dentro do container
USER node

EXPOSE 3000
CMD ["node", "dist/main.js"]
