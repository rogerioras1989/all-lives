FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json .npmrc ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy; echo EXIT:$?; echo PORT=$PORT; npx next start 2>&1"]
