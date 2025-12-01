FROM node:20-bookworm AS deps

WORKDIR /app

# Установка зависимостей
COPY package.json package-lock.json* ./

# Используем install вместо ci, чтобы не требовать package-lock.json
RUN npm install --omit=dev

FROM node:20-bookworm AS builder

WORKDIR /app

ENV NODE_ENV=production

# Копируем исходники и node_modules
COPY . .
COPY --from=deps /app/node_modules ./node_modules

# Сборка Next.js приложения
RUN npm run build

FROM node:20-bookworm AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Создаем директорию для данных (файлы и база документов)
RUN mkdir -p /app/data/uploads

# Копируем только то, что нужно для запуска
COPY package.json package-lock.json* ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

# Директория с файлами/БД будет монтироваться как volume
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["npm", "run", "start"]


